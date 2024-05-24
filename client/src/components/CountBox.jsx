import React from 'react'

const CountBox = ({ title, value }) => {
  return (
    <div className="flex flex-col items-center w-[150px] rounded-md overflow-hidden">
      <h4 className="font-epilogue font-bold text-[30px] text-white p-3 bg-col-2 w-full text-center truncate">{value}</h4>
      <p className="font-epilogue font-normal text-[16px] text-white bg-col-3 px-3 py-2 w-full rouned-b-[10px] text-center">{title}</p>
    </div>
  )
}

export default CountBox