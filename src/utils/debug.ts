export const DEBUG = process.env.NODE_ENV === 'development';

export const debug = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};
