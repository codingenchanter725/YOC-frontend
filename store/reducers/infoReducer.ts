import { GET_PROJECT_INFO, WALLET_CONNECT, WALLET_DISCONNECT, WALLET_UPDATE } from "../types";

const initialState = {
  account: undefined,
  balance: undefined, 
  provider: undefined,
  signer: undefined,
  chainId: undefined,
  projects: [],
};

const getInfo = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_PROJECT_INFO:
    case WALLET_CONNECT:
    case WALLET_DISCONNECT:
    case WALLET_UPDATE: 
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

export default getInfo;
