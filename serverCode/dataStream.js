let dataStream = [];

export const addToDataStream = (str) => {
  dataStream = str;
};

export const getDataStream = () => {
  return dataStream;
};

export const clearDataStream = () => {
  dataStream = "";
};
