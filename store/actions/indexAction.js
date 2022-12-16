import { GET_PROJECT_INFO, LOADING_END, LOADING_START, WALLET_CONNECT, WALLET_DISCONNECT } from "../types";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Contract, ethers } from "ethers";
import { rpc_provider_basic } from "../../utils/rpc_provider";
import {
  ProjectManager,
  ProjectDetail,
} from "../../src/constants/contracts";

let web3Modal = null;

const projectDetailInfo = async (address, connectedAddress = "0x0000000000000000000000000000000000000000", rpc_provider) => {
  try {
    let detailAddress = ProjectDetail.address;
    const detailContract = new Contract(detailAddress, ProjectDetail.abi, rpc_provider);
    let detailProject = await detailContract.getProjectDetails(address, connectedAddress);

    const projectDetailObj = {};
    const shareTokenAddress = detailProject.shareToken;
    const investTokenAddress = detailProject.investToken;
    const shareDecimal_temp = Number(ethers.utils.formatUnits(detailProject.shareTokenDecimals, 0));
    const investDecimal_temp = Number(ethers.utils.formatUnits(detailProject.investTokenDecimals, 0));
    const totalRaise_temp = Number(ethers.utils.formatUnits(detailProject.investTotalAmount, investDecimal_temp));
    const totalYTEST_temp = Number(ethers.utils.formatUnits(detailProject.shareTokenSellAmount, shareDecimal_temp));
    const shareTokenAmount_temp = Number(ethers.utils.formatUnits(detailProject.shareTokenBalanceTemp, shareDecimal_temp));

    // console.log(
    //   shareTokenAddress,
    //   await detailContract.getTokenInfo(
    //     shareTokenAddress,
    //     [
    //       connectedAddress,
    //       connectedAddress
    //     ]
    //   )
    // );

    projectDetailObj.poolAddress = address;
    projectDetailObj.APR = Number(ethers.utils.formatUnits(detailProject.apr, 0));
    projectDetailObj.totalRaise = totalRaise_temp;
    projectDetailObj.totalYTEST = totalYTEST_temp;
    projectDetailObj.currentStatus = Number((totalYTEST_temp - shareTokenAmount_temp) * 100 / totalYTEST_temp);
    projectDetailObj.endDate = Number(ethers.utils.formatUnits(detailProject.endDate, 0));
    projectDetailObj.name = detailProject.title;
    projectDetailObj.logoSrc = detailProject.icon;
    projectDetailObj.symbolImage = detailProject.symbolImage;
    projectDetailObj.tokenPrice = Number(ethers.utils.formatUnits(detailProject.shareTokenPrice, 3));
    projectDetailObj.explanation = detailProject.description;

    projectDetailObj.ROI = Number(ethers.utils.formatUnits(detailProject.roi, 0));
    projectDetailObj.category = detailProject.category;
    projectDetailObj.investDecimal = investDecimal_temp;
    projectDetailObj.shareDecimal = shareDecimal_temp;
    projectDetailObj.shareToken = shareTokenAddress;
    projectDetailObj.investToken = investTokenAddress;
    projectDetailObj.projectURL = detailProject.projectWebsite;
    if (connectedAddress) {
      projectDetailObj.claimAmount = Number(ethers.utils.formatUnits(detailProject.claimableAmount, investDecimal_temp));
      projectDetailObj.claimable = detailProject.claimable;
      projectDetailObj.investTokenBalance = ethers.utils.formatUnits(detailProject.investTokenBalance, investDecimal_temp);
      projectDetailObj.shareTokenBalance = ethers.utils.formatUnits(detailProject.shareTokenBalance, shareDecimal_temp);

      let availableTokenTotalPrice = ((totalYTEST_temp - (projectDetailObj.currentStatus * totalYTEST_temp / 100)) / projectDetailObj.tokenPrice).toFixed(2);
      let maxValue = Number(availableTokenTotalPrice) < Number(projectDetailObj.investTokenBalance) ? availableTokenTotalPrice : projectDetailObj.investTokenBalance;
      projectDetailObj.availableMaxUsdValue = maxValue.toString();
    }

    return projectDetailObj;
  } catch (ex) {
    console.log("project detail info error: ", ex);
  }
}

export const projectInfos = (account, rpc_provider) => async (dispatch) => {
  try {
    const ProjectManagerInstance = new Contract(ProjectManager.address, ProjectManager.abi, rpc_provider);
    const projects = await ProjectManagerInstance.getProjectAllContract();
    const projectsDetail = [];

    Promise.all(
      projects.map(item => {
        return new Promise(async (resolve) => {
          const projectInfoObj = await projectDetailInfo(item, account, rpc_provider);
          projectsDetail.push(projectInfoObj);
          resolve();
        });
      })
    ).then(() => {
      dispatch({
        type: GET_PROJECT_INFO,
        payload: {
          projects: projectsDetail
        }
      })
    })

  } catch (error) {
    console.log("project infos error: ", error);
  }
};

export const addNewProject = (projectsList, newAddress, account) => async (dispatch) => {
  try {
    new Promise(async (resolve) => {
      const projectInfoObj = await projectDetailInfo(newAddress, account);
      projectsList.push(projectInfoObj);
      resolve();
    }).then(() => {
      dispatch({
        type: GET_PROJECT_INFO,
        payload: {
          projects: projectsList
        }
      })
    })

  } catch (ex) {
    console.log("new add project error: ", ex)
  }
};

export const updateProjectInfo = (projectList, projectAddress, account) => async (dispatch) => {
  try {
    new Promise(async (resolve) => {
      const projectInfoObj = await projectDetailInfo(projectAddress, account);
      projectList.map((item, index) => {
        if (item.poolAddress == projectAddress) {
          projectList[index] = projectInfoObj;
          return;
        }
      })
      resolve();
    }).then(() => {
      dispatch({
        type: GET_PROJECT_INFO,
        payload: {
          projects: projectList
        }
      })
    })
  } catch (ex) {
    console.log("update project info error: ", ex);
  }
};

export const walletConnect = () => async (dispatch) => {
  const rpc_provider = rpc_provider_basic;
  try {
    const providerOptions = {
      injected: {
        display: {
          name: "Metamask",
        }
      },
      walletconnect: {
        display: {
          name: "WalletConnect",
        },
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: process.env.MAIN_NETWORK_URL,
            5: process.env.TEST_NETWORK_URL
          }
        }
      }
    };

    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
      disableInjectedProvider: false,
      theme: {
        background: "rgb(39, 49, 56)",
        main: "rgb(199, 199, 199)",
        secondary: "rgb(136, 136, 136)",
        border: "rgba(195, 195, 195, 0.14)",
        hover: "rgb(16, 26, 32)",
      },
    });

    const instance = await web3Modal.connect();

    if (Number(instance.chainId) !== Number(process.env.CHAIN_ID)) {
      try {
        await web3.currentProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${Number(process.env.CHAIN_ID).toString(16)}` }]
        });
      } catch (error) {
        alert(error.message);
      }
      return;
    }

    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const account = await signer.getAddress();

    provider.on("disconnect", () => {
      dispatch(walletDisconnect())
    });

    provider.on("accountsChanged", (accounts) => {
      dispatch(walletConnect())
      console.log(accounts);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
      dispatch(walletConnect())
      console.log(chainId);
    });

    localStorage.setItem('account', account);

    dispatch({
      type: WALLET_CONNECT,
      payload: {
        account: account,
        provider: provider,
        chainId: instance.chainId,
        signer: signer, 
        rpc_provider: rpc_provider
      }
    })

    dispatch(projectInfos(account, rpc_provider));

  } catch (error) {
    console.log("Wallet Connect error: ", error)
  }
}

export const walletDisconnect = () => async (dispatch) => {
  try {
    await web3Modal.clearCachedProvider();
    localStorage.setItem('account', undefined);
    dispatch({
      type: WALLET_DISCONNECT, 
      payload: {
        account: undefined,
        provider: undefined,
        chainId: undefined,
        signer: undefined, 
        rpc_provider: undefined
      }
    })
    dispatch(projectInfos(undefined));
  } catch (error) {
    console.log("Wallet Disconnect error: ", error)
  }
}

export const getShareTokenBalance = (address, accounts) => async (dispatch) => {
  try {
    const ProjectManagerInstance = new Contract(ProjectManager.address, ProjectManager.abi, rpc_provider);
    const projects = await ProjectManagerInstance.getProjectAllContract();
    const projectsDetail = [];

    Promise.all(
      projects.map(item => {
        return new Promise(async (resolve) => {
          const projectInfoObj = await projectDetailInfo(item, account);
          projectsDetail.push(projectInfoObj);
          resolve();
        });
      })
    ).then(() => {
      dispatch({
        type: GET_PROJECT_INFO,
        payload: {
          projects: projectsDetail
        }
      })
    })

  } catch (error) {
    console.log("project infos error: ", error);
  }
}