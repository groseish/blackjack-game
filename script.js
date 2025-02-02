document.addEventListener('DOMContentLoaded', function() {
  // =====================================================
  // INITIAL SETUP & GLOBAL VARIABLES
  // =====================================================
  let balance = 500;
  if (localStorage.getItem('playerBalance') !== null) {
    balance = parseInt(localStorage.getItem('playerBalance'), 10);
  }
  
  let currentBet = 5; // Minimum bet
  const fullDeckCount = 4;             // Always 4 when a new shoe is created
  let currentRemainingDecks = fullDeckCount; // How many decks remain before reshuffle
  let cardsDealt = 0;                  // How many cards have been dealt since last deck decrement

  let deck = [];
  let dealerHand = [];
  let playerHands = [];
  let dealerScore = 0;
  let playerScores = [];
  let betAmount = 5;
  let bets = [];
  const minBet = 5;
  let activeHandIndex = 0;
  let isDoubleDown = false;
  let dealerShouldReveal = false;

  const suits = ['♠', '♥', '♦', '♣'];
  const values = [
      { name: 'A', value: [1, 11] },
      { name: '2', value: 2 },
      { name: '3', value: 3 },
      { name: '4', value: 4 },
      { name: '5', value: 5 },
      { name: '6', value: 6 },
      { name: '7', value: 7 },
      { name: '8', value: 8 },
      { name: '9', value: 9 },
      { name: '10', value: 10 },
      { name: 'J', value: 10 },
      { name: 'Q', value: 10 },
      { name: 'K', value: 10 }
  ];

  // =====================================================
  // UTILITY & KEYBOARD FUNCTIONS
  // =====================================================
  
  function updateBalance() {
    document.getElementById('balance').innerText = balance;
  }
  
  function clickButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button && !button.disabled) {
      button.click();
      return true;
    }
    return false;
  }
  
  function handleSpacebar() {
    if (!clickButton('hit-button')) {
      clickButton('deal-button');
    }
  }
  
  function updateBetAmount(change) {
    currentBet += change;
    if (currentBet < 5) {
      currentBet = 5;
    } else if (currentBet > balance) {
      currentBet = balance;
    }
    document.getElementById('bet-amount').value = currentBet;
  }
  
  function showKeyboardShortcuts(show) {
    const hitButton = document.getElementById('hit-button');
    const standButton = document.getElementById('stand-button');
    const dealButton = document.getElementById('deal-button');
    const doubleDownButton = document.getElementById('double-button');
    const splitButton = document.getElementById('split-button');
    const betAmountLabel = document.querySelector('label[for="bet-amount"]');
  
    if (show) {
      hitButton.innerText = "Hit (Space)";
      standButton.innerText = "Stand (S)";
      dealButton.innerText = "Deal (D or Space)";
      doubleDownButton.innerText = "Double Down (X)";
      splitButton.innerText = "Split (E)";
      betAmountLabel.innerText = "Bet Amount ($5 minimum) [use '[' and ']' to adjust]: ";
    } else {
      hitButton.innerText = "Hit";
      standButton.innerText = "Stand";
      dealButton.innerText = "Deal";
      doubleDownButton.innerText = "Double Down";
      splitButton.innerText = "Split";
      betAmountLabel.innerText = "Bet Amount ($5 minimum): ";
    }
  }
  
  document.addEventListener('keydown', function(event) {
    if (event.key === 'q') {
      showKeyboardShortcuts(true);
    }
    switch(event.key) {
      case 's':
        clickButton('stand-button');
        break;
      case 'd':
        clickButton('deal-button');
        break;
      case 'x':
        clickButton('double-button');
        break;
      case 'e':
        clickButton('split-button');
        break;
      case ' ':
        event.preventDefault();
        handleSpacebar();
        break;
      case '[':
        updateBetAmount(-5);
        break;
      case ']':
        updateBetAmount(5);
        break;
    }
  });
  
  document.addEventListener('keyup', function(event) {
    if (event.key === 'q') {
      showKeyboardShortcuts(false);
    }
  });
  
  // =====================================================
  // DECK & GAME LOGIC FUNCTIONS
  // =====================================================
  
  function createDeck() {
    deck = [];
    for (let d = 0; d < fullDeckCount; d++) {
      for (let suit of suits) {
        for (let val of values) {
          deck.push({
            suit: suit,
            name: val.name,
            value: val.value
          });
        }
      }
    }
    shuffleDeck();
  }
  
  function shuffleDeck() {
    showShuffleAnimation();
    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }
  }
  
  function updateDeckCount() {
    document.getElementById('deck-count').innerText = currentRemainingDecks;
  }
  
  function triggerShuffle() {
    showShuffleAnimation();
    setTimeout(() => {
      createDeck();
      currentRemainingDecks = fullDeckCount;
      cardsDealt = 0;
      updateDeckCount();
    }, 2000);
  }
  
  function drawCard() {
    if (deck.length === 0) {
      createDeck();
    }
    let card = deck.pop();
    
    // Track cards dealt and update deck count every 52 cards:
    cardsDealt++;
    if (cardsDealt >= 52) {
      currentRemainingDecks--;
      cardsDealt -= 52;
      updateDeckCount();
      if (currentRemainingDecks <= 0) {
        triggerShuffle();
      }
    }
    
    return card;
  }
  
  function startGame() {
    betAmount = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount < minBet) {
      alert(`Minimum bet is $${minBet}.`);
      return;
    }
    if (betAmount > balance) {
      betAmount = balance;
      document.getElementById('bet-amount').value = betAmount;
    }
    if (deck.length < fullDeckCount * 52 * 0.25) { 
      createDeck();
    }
    dealerHand = [];
    playerHands = [[]];
    bets = [betAmount];
    dealerScore = 0;
    playerScores = [];
    activeHandIndex = 0;
    isDoubleDown = false;
    dealerShouldReveal = false;
    
    // Reset UI elements
    document.getElementById('message').innerText = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('dealer-score').innerText = '';
    document.getElementById('player-hands').innerHTML = '';
    document.getElementById('hit-button').disabled = false;
    document.getElementById('stand-button').disabled = false;
    document.getElementById('double-button').disabled = false;
    document.getElementById('split-button').disabled = false;
    document.getElementById('deal-button').disabled = true;
    document.getElementById('bet-amount').disabled = true;
    
    balance -= betAmount;
    updateBalance();
    
    // Deal initial cards:
    playerHands[0].push(drawCard());
    dealerHand.push(drawCard());
    playerHands[0].push(drawCard());
    dealerHand.push(drawCard());
    renderHands();
    checkForBlackjack();
  }
  
  async function renderHands(animate = true) {
    const dealerCardsDiv = document.getElementById('dealer-cards');
    const playerHandsDiv = document.getElementById('player-hands');
    dealerCardsDiv.innerHTML = '';
    playerHandsDiv.innerHTML = '';
    
    // Render player hands:
    for (let i = 0; i < playerHands.length; i++) {
      let handDiv = document.createElement('div');
      handDiv.className = 'player-hand';
      if (i === activeHandIndex) {
        handDiv.classList.add('active-hand');
      }
      let handTitle = document.createElement('h3');
      handTitle.innerText = `Hand ${i + 1} - Bet: $${bets[i]}`;
      handDiv.appendChild(handTitle);
      
      let cardsDiv = document.createElement('div');
      cardsDiv.className = 'player-cards';
      handDiv.appendChild(cardsDiv);
      
      let scoreDiv = document.createElement('div');
      scoreDiv.className = 'score-display';
      scoreDiv.innerText = `Score: ${calculateScore(playerHands[i])}`;
      handDiv.appendChild(scoreDiv);
      
      playerHandsDiv.appendChild(handDiv);
      
      for (let j = 0; j < playerHands[i].length; j++) {
        const cardElement = createCardElement(playerHands[i][j]);
        if (animate) {
          await animateCardDeal(cardElement, cardsDiv, j * 200);
        } else {
          cardElement.classList.add('dealt');
          cardsDiv.appendChild(cardElement);
        }
      }
    }
    
    // Render dealer hand:
    for (let i = 0; i < dealerHand.length; i++) {
      const cardElement = createCardElement(dealerHand[i], i === 0 && !dealerShouldReveal);
      if (animate) {
        await animateCardDeal(cardElement, dealerCardsDiv, i * 200);
      } else {
        cardElement.classList.add('dealt');
        dealerCardsDiv.appendChild(cardElement);
      }
    }
    
    if (dealerShouldReveal) {
      dealerScore = calculateScore(dealerHand);
      document.getElementById('dealer-score').innerText = 'Score: ' + dealerScore;
    } else {
      document.getElementById('dealer-score').innerText = 'Score: ?';
    }
  }
  
  function calculateScore(hand) {
    let total = 0;
    let aces = 0;
    for (let card of hand) {
      if (card.name === 'A') {
        aces += 1;
      } else {
        total += card.value;
      }
    }
    for (let i = 0; i < aces; i++) {
      total += (total + 11 <= 21) ? 11 : 1;
    }
    return total;
  }
  
  async function hit() {
    if (isDoubleDown) return;
    const newCard = drawCard();
    playerHands[activeHandIndex].push(newCard);
    const handDiv = document.querySelector(`#player-hands .player-hand:nth-child(${activeHandIndex + 1})`);
    const cardsDiv = handDiv.querySelector('.player-cards');
    const cardElement = createCardElement(newCard);
    await animateCardDeal(cardElement, cardsDiv, 0);
    const score = calculateScore(playerHands[activeHandIndex]);
    handDiv.querySelector('.score-display').innerText = `Score: ${score}`;
    if (score > 21 || score === 21) {
      moveToNextHand();
    }
  }
  
  function stand() {
    moveToNextHand();
  }
  
  function createCardElement(card, hidden = false) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = hidden ? '🂠' : card.name + card.suit;
    return cardElement;
  }
  
  async function animateCardDeal(cardElement, targetContainer, delay = 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
    targetContainer.appendChild(cardElement);
    setTimeout(() => {
      cardElement.classList.add('dealt');
    }, 50);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  function doubleDown() {
    if (playerHands[activeHandIndex].length > 2) {
      alert('You can only double down on your first two cards.');
      return;
    }
    if (balance < bets[activeHandIndex]) {
      alert('You do not have enough balance to double down.');
      return;
    }
    balance -= bets[activeHandIndex];
    bets[activeHandIndex] *= 2;
    updateBalance();
    isDoubleDown = true;
    playerHands[activeHandIndex].push(drawCard());
    renderHands(false);
    moveToNextHand();
  }
  
  function split() {
    let hand = playerHands[activeHandIndex];
    if (hand.length !== 2 || hand[0].name !== hand[1].name) {
      alert('You can only split identical cards on your first two cards.');
      return;
    }
    if (balance < bets[activeHandIndex]) {
      alert('You do not have enough balance to split.');
      return;
    }
    balance -= bets[activeHandIndex];
    updateBalance();
    let newHand1 = [hand[0]];
    let newHand2 = [hand[1]];
    newHand1.push(drawCard());
    newHand2.push(drawCard());
    playerHands.splice(activeHandIndex, 1, newHand1, newHand2);
    bets.splice(activeHandIndex, 1, bets[activeHandIndex], bets[activeHandIndex]);
    renderHands(false);
  }
  
  function moveToNextHand() {
    activeHandIndex++;
    isDoubleDown = false;
    if (activeHandIndex >= playerHands.length) {
      dealerTurn();
    } else {
      renderHands(false);
    }
  }
  
  async function dealerTurn() {
    document.getElementById('hit-button').disabled = true;
    document.getElementById('stand-button').disabled = true;
    document.getElementById('double-button').disabled = true;
    document.getElementById('split-button').disabled = true;
    dealerShouldReveal = true;
    await renderHands(false);
    dealerScore = calculateScore(dealerHand);
    while (dealerScore < 17) {
      const newCard = drawCard();
      dealerHand.push(newCard);
      dealerScore = calculateScore(dealerHand);
      const dealerCardsDiv = document.getElementById('dealer-cards');
      const cardElement = createCardElement(newCard, false);
      await animateCardDeal(cardElement, dealerCardsDiv, 0);
      document.getElementById('dealer-score').innerText = 'Score: ' + dealerScore;
    }
    determineWinners();
  }
  
  function determineWinners() {
    let messages = [];
    for (let i = 0; i < playerHands.length; i++) {
      let score = calculateScore(playerHands[i]);
      if (score > 21) {
        messages.push(`Hand ${i + 1}: Bust! Dealer wins.`);
      } else if (dealerScore > 21) {
        balance += bets[i] * 2;
        messages.push(`Hand ${i + 1}: Dealer busts! You win!`);
      } else if (score > dealerScore) {
        balance += bets[i] * 2;
        messages.push(`Hand ${i + 1}: You win!`);
      } else if (score < dealerScore) {
        messages.push(`Hand ${i + 1}: Dealer wins.`);
      } else {
        balance += bets[i];
        messages.push(`Hand ${i + 1}: Push.`);
      }
    }
    updateBalance();
    document.getElementById('message').innerText = messages.join('\n');
    document.getElementById('deal-button').disabled = false;
    document.getElementById('bet-amount').disabled = false;
    setTimeout(() => {
      if (balance < minBet) {
        triggerGameOver();
      }
    }, 100);
  }
  
  function checkForBlackjack() {
    let playerScore = calculateScore(playerHands[0]);
    dealerScore = calculateScore(dealerHand);
    if (playerScore === 21 && dealerScore === 21) {
      balance += bets[0];
      updateBalance();
      endGame('Both have blackjack! Push.');
    } else if (playerScore === 21) {
      balance += bets[0] * 2.5;
      updateBalance();
      endGame('Blackjack! You win!');
    } else if (dealerScore === 21) {
      endGame('Dealer has blackjack. Dealer wins.');
    }
  }
  
  function endGame(message) {
    document.getElementById('message').innerText = message;
    document.getElementById('hit-button').disabled = true;
    document.getElementById('stand-button').disabled = true;
    document.getElementById('double-button').disabled = true;
    document.getElementById('split-button').disabled = true;
    dealerShouldReveal = true;
    renderHands(false);
    document.getElementById('deal-button').disabled = false;
    document.getElementById('bet-amount').disabled = false;
    if (balance < minBet) {
      triggerGameOver();
    }
  }
  
  function resetGame() {
    balance = 500;
    updateBalance();
    document.getElementById('bet-amount').value = minBet;
  }
  
  function showShuffleAnimation() {
    const shuffleOverlay = document.getElementById('shuffle-overlay');
    shuffleOverlay.style.display = 'flex';
    setTimeout(() => {
      shuffleOverlay.style.display = 'none';
    }, 2000);
  }
  
  function triggerGameOver() {
    const overlay = document.getElementById('game-over-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
      overlay.classList.remove('active');
      resetGame();
      localStorage.removeItem('playerBalance');
    }, 2000);
  }
  
  // =====================================================
  // BUTTON EVENT LISTENERS & INITIALIZATION
  // =====================================================
  
  document.getElementById('deal-button').addEventListener('click', startGame);
  document.getElementById('hit-button').addEventListener('click', hit);
  document.getElementById('stand-button').addEventListener('click', stand);
  document.getElementById('double-button').addEventListener('click', doubleDown);
  document.getElementById('split-button').addEventListener('click', split);
  
  // Save Button: Save the current balance to localStorage
  document.getElementById('save-button').addEventListener('click', function() {
    localStorage.setItem('playerBalance', balance);
    alert("Game saved! Your balance of $" + balance + " has been saved.");
  });
  
  updateBalance();
  updateDeckCount();
  createDeck();
});
