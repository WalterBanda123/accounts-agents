import React from 'react'
import AuthContext from './AuthContext'

const useAuthContext = () => {
  const authContext =  React.useContext(AuthContext);
  if(!authContext) {
    throw Error("Auth context not found!")
  };
  return authContext
}

export default useAuthContext