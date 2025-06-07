
import React from 'react';
import './DateSeparator.css';

interface DateSeparatorProps {
  dateLabel: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ dateLabel }) => {
  return (
    <div className="date-separator">
      <span className="date-text">{dateLabel}</span>
    </div>
  );
};

export default DateSeparator;
