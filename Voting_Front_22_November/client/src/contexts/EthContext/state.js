const actions = {
  init: "INIT",
};

const initialState = {
  web3: null,
  accounts: null,
  contract: null,
  isOwner: false,
  networkID: null,
  isVoter: false,
  voter: null,
  workflowStatus: undefined,
  winningProposalId: undefined,
  isWeb3Loading: true
};

const reducer = (state, action) => {
  const { type, data } = action;
  switch (type) {
    case actions.init:
      return { ...state, ...data };
    default:
      throw new Error("Undefined reducer action type");
  }
};

export {
  actions,
  initialState,
  reducer
};
