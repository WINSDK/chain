import React, { useState } from "react";

function BetForm({ betOptions, betPercentage }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [betAmount, setBetAmount] = useState('');
    const [votesToBet, setVotesToBet] = useState('');
  
    const handleOptionChange = (event) => {
        const selectedIndex = betOptions.indexOf(event.target.value); // Find index of selected option
        setSelectedOption(event.target.value);
        setSelectedIndex(selectedIndex);

        setBetAmount(betPercentage[selectedIndex] / 100);
        setVotesToBet(inputValue * (betPercentage[selectedIndex] / 100));
      };
  
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
        setBetAmount(betPercentage[selectedIndex] / 100);
        setVotesToBet(inputValue * (betPercentage[selectedIndex] / 100));

    };

  const styles = {
    form_container: {
        margin: '20px',
        padding: '10px',
        backgroundColor: 'lightblue',
        borderRadius: '5px',
    },
  
    }

    const handleSubmit   
    = () => {
       // Handle form submission here, e.g., send data to a server
       console.log('Selected Option:', selectedOption);
       console.log('Selected Index:', selectedIndex);
       console.log('Input Value:', inputValue);
     };

  return (
    <form style={styles.form_container}>
        {betOptions.map((option, index) => (
            <div key={index}>
            <input type="radio" value={option} checked={selectedOption === option} onChange={handleOptionChange} />
            <label> {option}</label>
            </div>
        ))}
      <br />
        <div>
            <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Enter your bet amount" />
        </div>
      <br />
        <button type="button" onClick={handleSubmit}> Place Bet</button>
      <br />
        <div>
            Selected Option: {selectedOption}
            <br />
            Input Value: {inputValue}
            <br />
            Bet Amount: {betAmount} ETH
            <br />
            Total number of votes to bet: {parseFloat(votesToBet).toFixed(6)}  
        </div>
    </form>
  );
}

export default BetForm;