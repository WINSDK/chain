import React from "react";
import Slider from '@ant-design/react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import marketData from "../data/markets.json"

const SimpleSlider = () => {
  var settings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 3,
    slidesToScroll: 3
  };
  return (
        <div className='h-screen bg-slate-700 my-10'>
      <div className='w-4/8 mx-8 my-4 '>
      <Slider {...settings}>
    {
            marketData.map((marketData, index) => {
            return (
                <div style="margin: 0 20px;" className="bg-slate-700 p-2">
                <div key={index} className='bg-white p-2 rounded-lg h-screen'>
                  <div>
                    <img src={marketData.imageUrl} />
                  </div>
                  <div>
                      <p className='font-semibold text-black text-center'>
                        {marketData.title} 
                    </p>
                  </div>
                  <div className='p-6 bg-blue-600 p-2'>
                    <p className='font-semibold text-white text-center'>
                        {marketData.description}
                        </p>
                    </div>
                    <div className='p-6 bg-gray-500 p-2'>
                    <ul className='font-semibold text-white text-center unstyled'>
                        {marketData.betOptions.map((option, index) => (
                        <li key={index}>
                          <h3>{option}</h3>
                          <div className='p-6 bg-orange-400 p-2 rounded-lg'>
                          <p className='font-semibold text-white text-center'>
                              ({marketData.betPercentage[index]}%)
                              </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    </div>
                </div>
                </div>
            );
            })
        }  
        </Slider>
      </div>
    </div>    
  );
}

export default SimpleSlider;