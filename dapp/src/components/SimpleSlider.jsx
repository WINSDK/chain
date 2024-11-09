import React, { useState, useEffect } from "react";
import Modal from "./Modal_clone";
import Slider from '@ant-design/react-slick';
import BetForm from "./BetForm";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import marketData from "../data/markets.json";
import { CallContract, ViewPredictionData } from "../../utils/contract_caller";
import { contract } from "@stellar/stellar-sdk";

const SimpleSlider = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [contractData, setContractData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [votePercentages, setVotePercentages] = useState([50, 50]);

  var settings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 3,
    slidesToScroll: 3
  };

  // Async function to fetch data from contract
  const fetchContractData = async (contractId) => {
    try {
      console.log("passed in contract id: ", contractId);
      // const response = await CallContract(contractId);
      const response = await ViewPredictionData(contractId);
      setContractData(response);
    } catch (error) {
      console.error("Error fetching contract data:", error);
    } finally {
      setLoading(false); 
    } 
  };

  const openModal = async (market) => {
    setLoading(true);
    setSelectedMarket(market); // Set the selected market data
    await fetchContractData(market.contractId);
    setLoading(false);
    setIsModalOpen(true); // Open the modal
  };

  useEffect(() => {
    fetchContractData();
  }, []); 

  const formatDateTime = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Format as a local date string
};

const formatInt = (int) => {
  return parseInt(int);
};

useEffect(() => {
  if (contractData) {
    // Assuming contractData contains votes for options
    const opt_1_votes = contractData.opt_1 || 0; 
    const opt_2_votes = contractData.opt_2 || 0; 

    // Compute percentages only once when contractData changes
    const [percentageOption1, percentageOption2] = computeBetPercentages(opt_1_votes, opt_2_votes);
    setVotePercentages([percentageOption1, percentageOption2]); // Update state with new percentages
  }
}, [contractData]); // Run this effect when contractData changes


// Function to compute bet percentages
const computeBetPercentages = (votesOption1, votesOption2) => {
  const totalVotes = votesOption1 + votesOption2;
  
  // Avoid division by zero
  if (totalVotes === 0) return [50, 50];

  const percentageOption1 = (votesOption1 / totalVotes) * 100;
  const percentageOption2 = (votesOption2 / totalVotes) * 100;

  return [percentageOption1.toFixed(2), percentageOption2.toFixed(2)];
};

  const styles = {
    container: {
        margin: '20px',
        padding: '10px',
        backgroundColor: 'lightblue',
        borderRadius: '5px',
    },
    title: {
        color: 'orange',
        fontSize: '36px',
    },
    subheader: {
      color: 'white',
      fontSize: '28px',
    },
    description: {
      color: 'white',
      fontSize: '24px',
    },
    link: {
      color: 'pink',
      fontSize: '24px',
  },
    carousel_deep_bg: {
      backgroundColor: '#6600CC',
    }
};

return (
  <div className='h-screen/3 bg-violet-900 my-10'>
      <div className='w-4/8 mx-8 my-4'>
        <br />
        {loading && <p style={styles.title}>Loading contract details...</p>}
        <br />
          <Slider {...settings}>
              {marketData.map((market, index) => (
                  <div key={index} style={{ margin: "0 20px" }} className="p-2">
                    {/* <div className='bg-violet-900 p-auto'>
                      
                    </div> */}
                      <div className='bg-gray-800 p-2 rounded-lg h-screen/3'>
                          {/* <img src={market.imageUrl} alt={market.title} /> */}
                          <p className='font-semibold text-white text-center p-2'>{market.title}</p>
                          <div className='p-6 bg-blue-700 p-2'>
                              <p className='font-semibold text-white text-center'>{market.description}</p>
                          </div>
                          <button 
                              onClick={() => openModal(market)} // Pass the current market object
                              className="my-4 mx-10 bg-green-700 text-white py-2 rounded"
                          >
                              View Details
                          </button>
                          
                      </div>
                  </div>
              ))}
          </Slider>

          {/* Modal Component */}
          <Modal id="market-modal" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} open="Open Modal">
              {selectedMarket && ( // Render content only if a market is selected
                  <div className="bg-gray-800 p-3 rounded-lg">

                  <h2 style={styles.title}>{selectedMarket.title}</h2>
                  <p style={styles.description}>{selectedMarket.description}</p>
                  <br />
                  <p style={styles.link}>
                    <a href={`https://stellar.expert/explorer/testnet/contract/${selectedMarket.contractId}`} target="_blank">
                    Visit stellarExpert Contract
                  </a>
                  <br/>
                  <a href={`https://stellar.expert/explorer/testnet/account/${selectedMarket.adminId}`} target="_blank">
                    Visit stellarExpert Admin
                  </a>
                    </p>

                  <br />
                      <hr />
                  <br/>
                      <div className='p-6 bg-gray-700'>
                      <br />
                            <ul className='font-semibold text-white text-center unstyled'>
 
                            {selectedMarket.betOptions.map((option, index) => (
                                  <li key={index}>
                                    <h3 style={styles.subheader}>
                                      {option} ({votePercentages[index]}%)
                                    </h3>
                                    <div className='p-6 bg-purple-300 p-2 rounded-lg'>
                                      <p>
                                        Cost per vote: {(votePercentages[index]).toFixed(5)} lumens
                                      </p>
                                    </div>
                                    <br />
                                  </li>
                                ))}
                            </ul>
                          </div>

                          <div>
                            <br />
                          {loading ? (
                              <p>Loading...</p>
                          ) : (
                              contractData && (
                                  <>
                                      <h3 style={styles.title}>Data from Contract:</h3>
                                      <pre style={styles.subheader}>
                                         {Object.entries(contractData).map(([key, value]) => {
                                          // Check if the key is 'start_t'/'end_t' and format it
                                          const displayValue = key === 'start_t' | key === 'end_t' ? formatDateTime(value) : formatInt(value);
                                          const relabelKey = key === 'start_t' ? 'Start Time' : key === 'end_t' ? 'End Time' 
                                          : key ==='opt_1' ? 'Option 1'
                                          : key ==='opt_2' ? 'Option 2'
                                          : key ==='total' ? 'Total'                                          
                                          : key;
                                          return (
                                              <div key={key}>
                                                  <strong>{relabelKey}:</strong> {displayValue}
                                              </div>
                                          );
                                      })}
                                      </pre>
                                  </>
                              )
                          )}
                      </div>

                      {/* <img src={selectedMarket.imageUrl} alt={selectedMarket.title} /> */}
                      <br />

                      <h2 style={styles.title}>Place your bet below: </h2>
                      <br />
                      
                      <BetForm betOptions={selectedMarket.betOptions} betPercentage={votePercentages} />
                      <br />
                  </div>
              )}
          </Modal>
      </div>
  </div>    
);
}


export default SimpleSlider;



