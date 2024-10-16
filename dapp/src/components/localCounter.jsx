import React, { useState } from 'react';

const Counter = () => {
  const [counter, setcounter] = useState(0);
  return (
    <>
      <div className='p-24 border  border-neutral-400 rounded-md bg-white text-black'>
        <h1 className='text-center text-2xl mb-8'>React Component</h1>
        <div className='flex mx-auto space-x-8 justify-center items-center'>
          <button
            onClick={() => setcounter((prev) => prev + 1)}
            className='bg-blue-700 text-white h-8 w-8'
          >
            +
          </button>
          <h3>{counter}</h3>

          <button
            onClick={() => setcounter((prev) => prev - 1)}
            className='bg-red-700 text-white h-8 w-8'
          >
            -
          </button>
        </div>
      </div>
    </>
  );
};

export default Counter;