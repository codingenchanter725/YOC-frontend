import { FC } from 'react';
import Image from "next/image";

import loading1 from "../../../public/images/simple-loading1.gif";
import loading2 from "../../../public/images/simple-loading2.gif";
import loading3 from "../../../public/images/simple-loading3.gif";

interface propsType {
    className?: string
}

const SimpleLoading: FC<propsType> = ({ className = "" }) => {
    return (
        <div className={`${className}`}>
            <Image className="w-full h-full" src={loading3} alt='loading' />
        </div>
    )
}

export default SimpleLoading;