import axios from "axios";
import React, { FC, useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";


type Props = {
    handleClose: () => void;
    votingQueryDetail?: any;
    votingResult: any;
    currentUserAnswer: any;
}

const UserVotingResult: FC<Props> = ({ handleClose, votingResult, votingQueryDetail, currentUserAnswer }) => {
    const { projects, account, signer } = useSelector((state: any) => state.data);
    const [queryId, setQueryId] = useState<number>(votingQueryDetail.id);
    const [queryContent, setQueryContent] = useState<string>(votingQueryDetail.queryContent);
    const [amountAnswer, setAmountAnswer] = useState<number>(votingQueryDetail.amountAnswer || 2);
    const [answerArr, setAnswerArr] = useState<string[]>(votingQueryDetail.answerStr.split(','));

    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const totalAmount = votingResult.reduce((prev: any, curr: any) => prev + curr.sum, 0);
    let answerList = [];
    for (let i = 0; i < amountAnswer; i++) {
        let percent = (votingResult[i].sum / totalAmount * 100);
        isNaN(percent) ? percent = 0 : '';
        answerList.push(<div className="answer_item" key={i}>
            <div className="answer">
                <p>{i + 1}:</p>
                <p>{answerArr[i]}</p>
            </div>
            <div className="result">
                <p>{percent.toFixed(2)}%</p>
            </div>
        </div>)
    }


    return <div className="user_voting_content">
        <div className="query_content">
            <p>{queryContent}</p>
        </div>
        <div className="answer_content">
            {answerList}
        </div>
        <div className="user_anwser mt-10">
            {
                currentUserAnswer ?
                    <p>You voted to {answerArr[currentUserAnswer]}</p>
                    :
                    // eslint-disable-next-line react/no-unescaped-entities
                    <p>You didn't voted</p>
            }
        </div>
        <div className="remain_date">
            <p>Voting Poll is already finished on {new Date(votingQueryDetail.endDate).toLocaleDateString()}</p>
        </div>
    </div>
}

export default UserVotingResult;
