# Voting.sol

A voting smart contract which can be used to make an election.
The deployer of the contract will be the admin.
He is only one to be able to manage the election status and voter list.
He can add voters with the function 'registerVoter' and update election step with the 'updateElectionStatus' function

## The voters

The voters are added by the admin.
Once added, they can propose proposals represented by a string with the 'registerProposal' function.
As the admin, they can check if a proposal hasn't already been submitted with the function 'doesProposalExist'.
BONUS: A check has been add to vetify if the proposal is not empty and if it has been already proposed.

## The proposals

The proposals are added by a voter.
A voter can register several proposals. But with a valid descriptionn (not empty) which doesn't already exist.
BONUS: Lot of getters to have infos about voters and proposals

## BONUS LIST
proposerAddress attribute in Proposal struct to retrieve winner's address.
totalVoters variable (for a voter to get total number of voters to see the total opponants.
votersAddress variable (for reset the election with 'startNewElection' function)
'doesProposalExist' function for a voter to check if a proposal description already exist before register it.
'getWinnerAddress' to get proposal's winner address.
Lot of getters for the voters to see info about election, proposals and others voters
And a nice documentation !! :D
