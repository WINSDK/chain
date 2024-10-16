// // import '../styles.css';
// // import "slick-carousel/slick/slick.css";
// // import "slick-carousel/slick/slick-theme.css";
// // import Slider from "react-slick";
// // import marketData from "../data/markets.json";


// // const data = [
// //     { "value": "First", "title": 'Iphone 5G Phone' },
// //     { "value": "2nd", "title": 'Samsung 5G Phone' },
// //     { "value": "3rd", "title": 'Intel 5G Phone' },
// //     { "value": "4th", "title": 'Poco 5G Phone' },
// //     { "value": "5th", "title": 'Techno 5G Phone' }
// //   ];


// // function App() {
// // // const App = () => {

// //   const settings = {
// //     dots: true,
// //     infinite: true,
// //     speed: 500,
// //     slidesToShow: 3,
// //     slidesToScroll: 3
// //   };
// //   return (
// //     <div >
// //       <Slider {...settings}>
// //         <div>
// //           <h3>1</h3>
// //         </div>
// //         <div>
// //           <h3>2</h3>
// //         </div>
// //         <div>
// //           <h3>3</h3>
// //         </div>
// //         <div>
// //           <h3>4</h3>
// //         </div>
// //         <div>
// //           <h3>5</h3>
// //         </div>
// //         <div>
// //           <h3>6</h3>
// //         </div>
// //       </Slider>
// //     </div>
// //   );

// //   return (
// //     <div className='h-screen bg-slate-600 pt-10'>
// //       <div className='w-3/4 m-auto '>
// //         {/* <Slider > */}
// //         {/* {data.map((item, index) => {
// //             return (
// //               <div key={index} className='bg-white'>
// //                 <div>
// //                   {item.value}
// //                 </div>
// //                 <div className='p-6 bg-blue-600'>
// //                   <p className='font-semibold text-white text-center'>{item.title}</p>
// //                 </div>
// //               </div>
// //             );
// //           })} */}
// //         {
// //             marketData.map((marketData, index) => {
                
// //             return (
// //                 <div key={index} className='bg-white'>
// //                   <div>
// //                       <p className='font-semibold text-black text-center'>
// //                         {marketData.title} 
// //                     </p>
// //                   </div>
// //                   <div className='p-6 bg-blue-600'>
// //                     <p className='font-semibold text-white text-center'>
// //                         {marketData.description}
// //                         </p>
// //                     </div>
// //                 </div>

// //                 // <CardCarousel
// //                 // title={marketData.title}
// //                 // description={marketData.description}
// //                 // betOptions={marketData.betOptions}
// //                 // betPercentage={marketData.betPercentage}
// //                 // imageUrl={marketData.imageUrl}
// //                 // />
// //             );
// //             })
// //         }
          
// //         {/* </Slider> */}
// //       </div>
// //     </div>
// //   );
// // }

// // export default App;


// import React, { useState } from 'react';
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
// import Slider from "react-slick";

// const data=[
//   {
//     image:'/images/1.jpg',
//     title:'Iphone 5G Phone',
//   },
//   {
//     image:'/images/2.jpg',
//     title:'Samsung 5G Phone',
//   },
//   {
//     image:'/images/3.jpg',
//     title:'Intel 5G Phone',
//   },
//   {
//     image:'/images/4.jpg',
//     title:'Poco 5G Phone',
//   },
//   {
//     image:'/images/5.jpg',
//     title:'Techno 5G Phone',
//   }
// ]

// const App = () => {

//   // const settings = {
//   //   dots: true,
//   //   infinite: true,
//   //   speed: 500,
//   //   slidesToShow: 3,
//   //   slidesToScroll: 3,
//   // };
//   const [settings, setSettings] = useState({
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 3,
//     slidesToScroll: 3,
//   });

//   // Function to update settings dynamically
//   const updateSettings = () => {
//     setSettings(prevSettings => ({
//       ...prevSettings,
//       slidesToShow: prevSettings.slidesToShow === 3 ? 1 : 3,
//     }));
//   };

//   return (
//     <div className='h-screen bg-slate-600 pt-10'>
//       <h1>START OF SLIDER</h1>

//       <div className='w-3/4 m-auto '>
//       <div>
//       <button onClick={updateSettings}>Toggle Slides</button>
//       {/* <Slider {...settings}> */}
//       {/* <Slider 
//         dots={true}
//         infinite={true}
//         speed={500}
//         slidesToShow={3}
//         slidesToScroll={3}
//       > */}
//         {data.map((item, index) => {
//             return(
//               <div key={index} className='bg-white p-4'>
//                 <div>
//                   {item.title}
//                 </div>
//               </div>
//             )
//           })}
//       {/* </Slider> */}
//       </div>
//       </div>
      
//     </div>
//   );
// }

// export default App;
