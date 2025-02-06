"use client";
import "@ant-design/v5-patch-for-react-19"
import { Spin, message } from "antd";
import { useAccount } from "wagmi";
import { gql, useQuery } from "@apollo/client";
import Web3 from 'web3'

import styles from "@/styles/Marketplace.module.scss"

const GET_MINTEDS = gql`
  query GetMinteds {
    minteds(first: 100, orderBy: sortHash, orderDirection: desc) {
      to,
      transactionHash
    }
  }
`;


export default function Marketplace() {
  const { address, isConnected } = useAccount();
  const { data, loading, error } = useQuery(GET_MINTEDS);
  const web3 = new Web3();


  console.log(loading, error)
  // const minteds = data.minteds.map((item) => item.to)

  if (loading) return <Spin spinning={true} size='large' fullscreen />

  if (error) {
    message.error(error.message);
  }
  const minteds = data?.minteds.map((item: any) => {
    return {
      to: web3.utils.toChecksumAddress(item.to),
      transactionHash: item.transactionHash
    }
  })

console.log( data?.minteds, minteds)

  const currentAddress = web3.utils.toChecksumAddress(address as string)

  // console.log(minteds, address, currentAddress)

  return (

    <div className="flex flex-col h-full w-full">
      <div className={`flex flex-col h-full w-full ${styles.container}`}>

        <section className={`flex flex-col justify-center items-center ${styles.topContent}`}>
          <p>KLK Genesis Pass Lottery</p>
          <p>Share a total of 359,000 USDT, with a maximum individual reward of 100,000 USDT.</p>
        </section>

        <section className={`flex flex-row justify-end items-center w-full ${styles.list}`}>
          <img className={styles.leftIcon} src="/images/bannerIcon.png" alt="" />

          <div className={`${styles.listContent} flex flex-col`}>

            {
              minteds?.map((item: any, index: number) => (
                <div key={index} className={`${styles.listItem} flex flex-row justify-between items-center`}>
                  {index === 0 && currentAddress === item.to ?
                    <img className={styles.isFirst} src="/images/first-user.png" alt="" />
                    : index === 0 && currentAddress !== item.to?
                      <img className={styles.isFirst} src="/images/first.png" alt="" />
                      : index !== 0 && currentAddress === item.to?
                        <img className={styles.isFirst} src="/images/userIcon.png" alt="" />
                    : <div className={styles.isFirst}></div>

                    }
                  <span>{item.to.slice(0, 14) + '...' + item.to.slice(-8)}</span>
                  <a href={`https://bscscan.com/tx/${item.transactionHash}`} target="_blank"><img className={styles.linkIcon} src="/images/linkIcon.png" alt="" /></a>
                </div>
              ))
            }

          </div>
        </section>


        <section className={`${styles.faqSection} flex flex-col w-full`}>
          <div>
            <p className={styles.faqQuestionTit}>How the rewards are distributed？</p>
            <p className={styles.faqContent}>
              Hash Rank 1: <span>Receive 100,000 USDT</span>  *If the hash values for the first rank are the same, the prize will be split equally. <br />
              Hash Rank 2: <span>Receive 50,000 USDT</span>  *If the hash values for the second rank are the same, the prize will be split equally. <br />
              Hash Rank 3: <span>Receive 30,000 USDT</span>  *If the hash values for the third rank are the same, the prize will be split equally. <br />
              Hash Rank 4: <span>Receive 20,000 USDT</span>  *If the hash values for the fourth rank are the same, the prize will be split equally.<br />
              Hash Ranks 5-10: <span>Receive 10,000 USDT</span>  *The prize will be evenly distributed among ranks 5-10. <br />
              Hash Ranks 11-1000: <span>Receive 100 USDT </span>
            </p>
          </div>
          <div>
            <p className={styles.faqQuestionTit}>When will the rewards be distributed?</p>
            <p className={styles.faqContent}>The rewards will be distributed after all 100,000 NFTs are minted. The distribution is expected to be completed within 7 business days.</p>
          </div>
        </section>
      </div>

      <img src="/images/footBg2.png" className={styles.footImg} alt="" />

    </div>

  );
}
