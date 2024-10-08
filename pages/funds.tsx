import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Contract, ethers, constants } from "ethers";
const { MaxUint256 } = constants;
import {
    USDCToken,
    Project,
    TokenTemplate,
    AdminWalletAddress
} from "../src/constants/contracts";
import Card from "@components/widgets/Card";
import ShowMoreIcon from "@components/widgets/ShowMoreIcon";
import { projectInfos } from "../store/actions";

import useLoading from "@hooks/useLoading";
import useAlert from "@hooks/useAlert";

const Fund: FC = () => {
    const [step, setStep] = useState(0);
    const dispatch = useDispatch();
    const { projects, signer, account, rpc_provider } = useSelector((state: any) => state.data);
    const { loadingStart, loadingEnd } = useLoading();
    const { alertShow } = useAlert();
    const [showMoreFlag, setShowMoreFlag] = useState(false);

    // for project 1 buy function
    const buyToken = async (amount: any, tokenPrice: any, poolAddress: string, investAddress: string, investDecimal: any, shareDecimal: any, investAllowance: any) => {
        if (account == undefined) {
            alertShow({
                status: 'failed',
                content: 'Please connect to the Metamask!'
            })
            return;
        } else if (account == AdminWalletAddress) {
            alertShow({
                status: 'failed',
                content: 'Admin can\'t buy token!'
            })
            return;
        }
        const ProjectContractInstance = new Contract(poolAddress, Project.abi, signer);
        const investTokenInstance = new Contract(investAddress, USDCToken.abi, signer);
        let investAmount = ethers.utils.parseUnits(amount, investDecimal);
        let shareAmount = ethers.utils.parseUnits((amount * tokenPrice).toFixed(2), shareDecimal);
        try {
            loadingStart();

            if (amount > +investAllowance) {
                let approve_investToken = await investTokenInstance.approve(poolAddress, MaxUint256, {
                    gasLimit: 300000
                });
                await approve_investToken.wait();
            }

            let participate = await ProjectContractInstance.participate(investAmount, shareAmount, {
                gasLimit: 300000
            });
            await participate.wait();
            loadingEnd();

        } catch (ex) {
            loadingEnd();
            console.log("buy token error: ", ex)
        }
    }

    // for project 1 refund function
    const refund = async (poolAddress: string, tokenPrice: any, shareAddress: string, investDecimal: any, shareDecimal: any, stakeAllowance: any) => {
        if (account == undefined) {
            alertShow({
                status: 'failed',
                content: 'Please connect to the Metamask!'
            })
            return;
        }
        const ProjectContractInstance = new Contract(poolAddress, Project.abi, signer);
        const shareTokenInstance = new Contract(shareAddress, TokenTemplate.abi, signer);

        let shareAmount = await shareTokenInstance.balanceOf(account);
        let shareAmountToEth = Number(ethers.utils.formatUnits(shareAmount, shareDecimal));
        if (shareAmountToEth == 0) {
            alertShow({
                status: 'failed',
                content: 'Your balance is zero!'
            })
            return
        }

        try {
            let investAmount = ethers.utils.parseUnits((shareAmountToEth / tokenPrice).toString(), investDecimal)

            loadingStart();
            if (shareAmount > stakeAllowance) {
                let approve_ytest = await shareTokenInstance.approve(poolAddress, shareAmount, {
                    gasLimit: 300000
                });
                await approve_ytest.wait();
            }

            let refund = await ProjectContractInstance.refund(shareAmount, investAmount, {
                gasLimit: 300000
            });
            await refund.wait();
            loadingEnd();
        } catch (ex) {
            loadingEnd();
        }
    }

    // claim function
    const claim = async (poolAddress: string) => {
        if (account == undefined) {
            alertShow({
                status: 'failed',
                content: 'Please connect to the Metamask!'
            })
            return;
        }
        const ProjectContractInstance = new Contract(poolAddress, Project.abi, signer);
        try {
            loadingStart();
            let claim = await ProjectContractInstance.claim({
                gasLimit: 300000
            });
            await claim.wait();
            loadingEnd();
        } catch (ex) {
            loadingEnd();
        }
    }

    // add invest token to Metamask
    const addToken = async () => {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20', // Initially only supports ERC20, but eventually more!
                options: {
                    address: USDCToken.address, // The address that the token is at.
                    symbol: 'USDC', // A ticker symbol or shorthand, up to 5 chars.
                    decimals: '6', // The number of decimals in the token
                    // image: 'https://otaris.io/png/otaris_logo.png', // A string url of the token logo
                },
            },
        });
    }

    useEffect(() => {
        if (account && rpc_provider) {
            dispatch(projectInfos(account) as any)
        }
    }, [account, dispatch, rpc_provider])

    return <>
        <div className="container">
            <div className="flex justify-between items-center py-8">
                <p className="leading-[1.5] w-[55%] lg:w-[50%] text-xl lg:text-4xl font-semibold">
                    Welcome to the new investment world where you can be part of Your Own Company
                </p>
                <img className="hidden lg:block w-[45%] h-full" src="/images/fund-bg.png" />
                <img className="block lg:hidden w-[40%] h-full" src="/images/fund-bg-mobile.png" />
            </div>
            <div className="flex justify-between items-center my-6">
                <div className="flex">
                    <div className={`bg-primary-pattern text-center ${step == 0 ? 'bg-secondary-pattern shadow-btn-primary' : ''} cursor-pointer rounded py-2 lg:py-4 px-6 lg:px-10 mr-2 lg:mr-4 text-base lg:text-xl text-white font-medium`} onClick={() => { setStep(0) }}>Open Projects</div>
                    <div className={`bg-primary-pattern text-center ${step == 1 ? 'bg-secondary-pattern shadow-btn-primary' : ''} cursor-pointer rounded py-2 lg:py-4 px-6 lg:px-10 mr-2 lg:mr-4 text-base lg:text-xl text-white font-medium`} onClick={() => { setStep(1) }}>Ongoing Projects</div>
                    <div className={`bg-primary-pattern text-center ${step == 2 ? 'bg-secondary-pattern shadow-btn-primary' : ''} cursor-pointer rounded py-2 lg:py-4 px-6 lg:px-10 mr-2 lg:mr-4 text-base lg:text-xl text-white font-medium`} onClick={() => { setStep(2) }}>Closed Projects</div>
                    <div className={`bg-primary-pattern text-center ${step == 3 ? 'bg-secondary-pattern shadow-btn-primary' : ''} cursor-pointer rounded py-2 lg:py-4 px-6 lg:px-10 mr-2 lg:mr-4 text-base lg:text-xl text-white font-medium`} onClick={() => { setStep(3) }}>My Projects</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {
                    step == 0 ?
                        projects.filter((item: any) => (item && item.endDate >= Date.now() && item.currentStatus < item.ongoingPercent)).map((item: any, index: number) => {
                            return (
                                <Card key={`card- + ${index}`} item={item} poolAddress={item} buyAction={buyToken} provider={rpc_provider} status="open" />
                            )
                        }) :
                        step == 1 ?
                            projects.filter((item: any) => (item && item.currentStatus >= item.ongoingPercent)).map((item: any, index: number) => {
                                return (
                                    <Card key={`card- + ${index}`} item={item} poolAddress={item} buyAction={buyToken} claimAction={claim} provider={rpc_provider} status="ongoing" />
                                )
                            }) :
                            step == 2 ?
                                projects.filter((item: any) => (item && item.endDate < Date.now() && item.currentStatus < item.ongoingPercent)).map((item: any, index: number) => {
                                    return (
                                        <Card key={`card- + ${index}`} item={item} poolAddress={item} refundAction={refund} provider={rpc_provider} status="close" />
                                    )
                                }) : ""
                }
                {
                    step == 3 ?
                        projects.filter((item: any) => item && item.joinState).map((item: any, index: number) => {
                            return (
                                <Card key={`card- + ${index}`} item={item} poolAddress={item} buyAction={buyToken} claimAction={claim} refundAction={refund} provider={rpc_provider} status="my" />
                            )
                        })
                        : ""
                }
            </div>
            {
                showMoreFlag ? <ShowMoreIcon text="Show More" /> : null
            }
        </div>
    </>
}

export default Fund;