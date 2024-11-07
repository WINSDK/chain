import React, { useState } from "react";
import Modal from "./Modal_clone";
import Slider from '@ant-design/react-slick';
import BetForm from "./BetForm";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import marketData from "../data/markets.json";

const SimpleSlider = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedMarket, setSelectedMarket] = useState(null);
  const singleVoteFee = 4 / 10000;

  var settings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 3,
    slidesToScroll: 3
  };

  const openModal = (market) => {
    setSelectedMarket(market); // Set the selected market data
    setIsModalOpen(true); // Open the modal
    // print("selected market: ", market)
    // console.log("selected market: ", market)
  };

  const styles = {
    container: {
        margin: '20px',
        padding: '10px',
        backgroundColor: 'lightblue',
        borderRadius: '5px',
    },
    title: {
        color: 'purple',
        fontSize: '36px',
    },
    subheader: {
      color: 'white',
      fontSize: '28px',
    },
    description: {
      color: 'gray',
      fontSize: '24px',
  },
};

return (
  <div className='h-screen bg-slate-700 my-10'>
      <div className='w-4/8 mx-8 my-4'>
          <Slider {...settings}>
              {marketData.map((market, index) => (
                  <div key={index} style={{ margin: "0 20px" }} className="bg-slate-700 p-2">
                      <div className='bg-white p-2 rounded-lg h-screen'>
                          <img src={market.imageUrl} alt={market.title} />
                          <p className='font-semibold text-black text-center'>{market.title}</p>
                          <div className='p-6 bg-blue-600 p-2'>
                              <p className='font-semibold text-white text-center'>{market.description}</p>
                          </div>
                          {/* Button to open modal with corresponding market data */}
                          <button 
                              onClick={() => openModal(market)} // Pass the current market object
                              className="my-4 mx-10 bg-green-600 text-white py-2 rounded"
                          >
                              View Details
                          </button>
                          <div className='p-6 bg-gray-500 p-2'>
                            <ul className='font-semibold text-white text-center unstyled'>
                           {market.betOptions.map((option, index) => (
                                <li key={index}>
                                  <h3>{option}</h3>
                                  <div className='p-6 bg-orange-300 p-2 rounded-lg'>
                                    <p className='font-semibold text-white text-center'>
                                      ({market.betPercentage[index]}%)
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                      </div>
                  </div>
              ))}
          </Slider>

          {/* Modal Component */}
          <Modal id="market-modal" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} open="Open Modal">
              {selectedMarket && ( // Render content only if a market is selected
                  <>

                  <h2 style={styles.title}>{selectedMarket.title}</h2>
                  <p style={styles.description}>{selectedMarket.description}</p>
                  <br/>
                      <div className='p-6 bg-gray-700'>
                      <br />
                            <ul className='font-semibold text-white text-center unstyled'>
                           {selectedMarket.betOptions.map((option, index) => (
                                <li key={index}>
                                  <h3 style={styles.subheader}>
                                    {option}  ({selectedMarket.betPercentage[index]}%)
                                  </h3>
                                  <div className='p-6 bg-purple-300 p-2 rounded-lg'>
                                    <p>
                                      Cost per vote: {selectedMarket.betPercentage[index].toFixed(5) / 1000 + singleVoteFee} ETH
                                    </p>
                                  </div>
                                  <br />
                                </li>
                              ))}
                            </ul>
                          </div>

                      <img src={selectedMarket.imageUrl} alt={selectedMarket.title} />
                      <br />

                      <h2 style={styles.title}>Place your bet below: </h2>
                      <br />
                      <BetForm betOptions={selectedMarket.betOptions} betPercentage={selectedMarket.betPercentage} />
                      <br />
                  </>
              )}
          </Modal>
      </div>
  </div>    
);
}


export default SimpleSlider;