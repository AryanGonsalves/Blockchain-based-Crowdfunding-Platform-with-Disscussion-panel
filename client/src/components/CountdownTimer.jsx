import React from 'react';
import DateTimeDisplay from '../utils/DateTimeDisplay';
import { useCountdown } from '../utils/useCountdown';

const ExpiredNotice = ({title}) => {
  return (
    <div className="flex flex-col items-center w-[150px] rounded-md overflow-hidden">
      <h4 className="font-epilogue font-bold text-[20px] text-white p-3 bg-col-2 rounded-t-[10px] w-full text-center truncate">Expired</h4>
      <p className="font-epilogue font-normal text-[16px] text-white bg-col-3 px-3 py-2 w-full rouned-b-[10px] text-center">{title}</p>
    </div>
  );
};



const ShowCounter = ({ title, days, hours, minutes, seconds }) => {
  return (
        <div className="flex flex-col items-center w-[150px]">
          <h4 className="font-epilogue font-bold text-[20px] text-white p-3 bg-col-1 rounded-t-[10px] w-full text-center truncate">
              <DateTimeDisplay value={days} type={'Days'} isDanger={days <= 1} />
              <DateTimeDisplay value={hours} type={'Hours'} isDanger={false} />
              <DateTimeDisplay value={minutes} type={'Mins'} isDanger={false} />
              <DateTimeDisplay value={seconds} type={'Seconds'} isDanger={false} />
        </h4>
          <p className="font-epilogue font-normal text-[16px] text-white bg-col-3  px-3 py-2 w-full rouned-b-[10px] text-center">{title}</p>
        </div>
    )
};

const CountdownTimer = ({ title, targetDate }) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice title={"Finished"}/>;
  } else {
    return (
      <ShowCounter
        title={title}
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  }
};

export default CountdownTimer;
