"use client";
import "@ant-design/v5-patch-for-react-19"
import { Spin, message } from "antd";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
// import detectEthereumProvider from '@metamask/detect-provider';
import MerkleTree from 'merkletreejs';
import Web3 from 'web3'
import { ethers } from 'ethers'
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import ConnectButton_custom from "@/components/ConnectButton_custom";


import { useEffect, useState } from "react";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import whiteList from "@/lib/whiteList.json"

import styles from "@/styles/Home.module.scss"

import IKLKGenesis from "@/lib/IKLKGenesis.json";
import ERC20_ABI from "@/lib/ERC20_abi.json";


const ContractAbi = IKLKGenesis.abi;
// const NFT_address = "0x5281e4Ee6D209D03FeD25B1f9845785B319eD9DC"
// const Token_address = '0x25C827A1457Ac12Bd020d2B70823537FAf2A1d24'

const NFT_address = "0xa68C9DF9f8e27e0BDDfC27Ffd2AE21734D8e429a"
const Token_address = '0xE3Bede9A87C79b82ff97aa5893d10E8c485A265c'

const whitelistStart = new Date('2025-02-01T12:00:00Z');
const publicStart = new Date('2025-03-01T12:00:00Z');
const currentTime = new Date();

const whitelistStart_timestamp = Math.floor(whitelistStart.getTime() / 1000);
const publicStart_timestamp = Math.floor(publicStart.getTime() / 1000);
const currentTime_timestamp = Math.floor(Date.now() / 1000);

const isWhiteStage = currentTime_timestamp >= whitelistStart_timestamp && currentTime_timestamp < publicStart_timestamp;
const isPublicStage = currentTime_timestamp >= publicStart_timestamp;


const GET_MINTEDS = gql`
  query GetMinteds {
    minteds(where:{blockTimestamp_gte:${whitelistStart_timestamp}, blockTimestamp_lt:${publicStart_timestamp}},
      first: 100, orderBy: sortHash, orderDirection: desc) {
      to,
    }
  }
`;

const GET_MINTEDS_FREE = gql`
  query GetMinteds {
    minteds(where:{blockTimestamp_gte:${publicStart_timestamp}, blockTimestamp_lt:${currentTime_timestamp}},
      first: 100, orderBy: sortHash, orderDirection: desc) {
      to,
    }
  }
`;

export default function Home() {
  const web3 = new Web3();
  const { address, isConnected } = useAccount();
  const { data: minteds, loading, error, refetch: refetchMinteds } = useQuery(isWhiteStage ? GET_MINTEDS : GET_MINTEDS_FREE);
  

  const whiteList_sum = whiteList.map((item: any) => web3.utils.toChecksumAddress(item))
  let current_address = address as string;
  let is_include_whiteList = false
  if (isConnected) {
    current_address = web3.utils.toChecksumAddress(address as string)
    is_include_whiteList = whiteList_sum.includes(current_address)
  }

  const [tokenId, setTokenId] = useState(3);
  const [mintCount, setMintCount] = useState(0);
  const [isCheck, setIsCheck] = useState(false);
  const [canMint, setCanMint] = useState(false);
  const [is_whiteList, setIsWhiteList] = useState(false)


  const { data: hashMint, isPending: isPendingMint, writeContract: writeContractMint } = useWriteContract();
  const { isLoading: isMintedLoading, isSuccess: isMintedSuccess, error: mintError } = useWaitForTransactionReceipt({
    hash: hashMint,
    query: {
      enabled: !!hashMint
    }
  });

  const { data: hashApprove, isPending: isPendingApprove, writeContract: writeContractApprove } = useWriteContract();

  const { data: allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance, isSuccess: isAllowanceSuccess } = useReadContract({
    address: Token_address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address, NFT_address],
  })

  const { data: hashFreeMint, isPending: isPendingFreeMint, writeContract: writeContractFreeMint } = useWriteContract();
  const { isLoading: isFreeMintedLoading, isSuccess: isFreeMintedSuccess, error: freeMintError } = useWaitForTransactionReceipt({
    hash: hashFreeMint,
    query: {
      enabled: !!hashFreeMint
    }
  });

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess, } = useWaitForTransactionReceipt({
    hash: hashApprove,
    query: {
      enabled: !!hashApprove
    }
  });

  async function getProof(user: string) {
    const web3 = await new Web3();
    const keccak256 = web3.utils.keccak256;

    const leaves = whiteList_sum.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const rootHash = '0x' + merkleTree.getHexRoot();
    console.log("root hash:", rootHash);

    return merkleTree.getHexProof(keccak256(user))
  }


  const handleMint = async () => {
    if (!address) return
    // 是否白名单
    if (!is_include_whiteList) {
      message.error("Not in whitelist");
      return;
    }
    const proof = await getProof(address);
    writeContractMint({
      abi: ContractAbi,
      address: NFT_address,
      functionName: "mint",
      args: [proof],
      // value: parseEther(amount)
    });
  }

  const handleFreeMint = async () => {
    if (!address) return;
    if (allowance?.toString() === '0') {
      try {
        await writeContractApprove({
          abi: ContractAbi,
          address: Token_address,
          functionName: "approve",
          args: [NFT_address, ethers.MaxUint256],
        });
        // 授权成功后调用 freeMint
        await writeContractFreeMint({
          abi: ContractAbi,
          address: NFT_address,
          functionName: "freeMint",
          // args: [],
        });
      } catch (error) {
        console.error("授权失败:", error);
      }
    } else {
      await writeContractFreeMint({
        abi: ContractAbi,
        address: NFT_address,
        functionName: "freeMint",
        // args: [],
      });
    }
  };

  const { data: tokenURI, isLoading: isLoadingTokenURI, refetch: refetchTokenURI, isSuccess: isTokenURISuccess } = useReadContract({
    address: NFT_address,
    abi: ContractAbi,
    functionName: "tokenURI",
    args: [tokenId],
    query: {
      enabled: false
    }
  })

  // check mint count
  const { data: times, isLoading: checkTimeLoading, refetch: refetchTime, isSuccess: isTimeSuccess } = useReadContract({
    address: NFT_address,
    abi: ContractAbi,
    functionName: "check",
    args: [address],
    query: {
      // enabled: false
    }
  })



  const getTokenURI = async () => {
    await refetchTokenURI();
    console.log("tokenURI:", tokenURI);
  }

  const handleCheck = async () => {
    console.log('123')
    if (!address) return;
    await refetchTime();
    console.log("times:", times);
    setIsCheck(true)
    setIsWhiteList(is_include_whiteList)
    if (isWhiteStage && Number(times) > 0 && is_include_whiteList) {
      setCanMint(true)
    }
  }

  useEffect(() => {
    console.log(isMintedSuccess, isFreeMintedSuccess, mintError, freeMintError)
    async function checkMintCount() {
      await refetchMinteds();
      console.log("minteds:", minteds)
      await refetchTime();
      console.log("times:", times)
    }
    if (isMintedSuccess || isFreeMintedSuccess) {
      message.success("Mint success");
      setTimeout(() => {
        checkMintCount()
      }, 1000);
    }
    if (mintError) {
      message.error("Mint error:" + mintError?.message);
    }
    if (freeMintError) {
      message.error("Free Mint error" + freeMintError?.message);
    }
  }, [isMintedSuccess, isFreeMintedSuccess, mintError, freeMintError]);

  useEffect(() => {
    if (Number(times) === 0) {
      setCanMint(false)
    }
  }, [times]);

  if(loading) return <Spin spinning={true} size='large' fullscreen />

  const mintedCount = minteds?.minteds.length || 0;

  // if (!address) return <Spin spinning={true} size='large' fullscreen />

  // if (isLoadingTokenURI) return <Spin spinning={true} size='large' fullscreen />


  return (
    <div className="flex flex-col h-full w-full">
      <div className={`flex flex-col h-full w-full ${styles.container}`}>
        {/* <button disabled={isPendingMint || isMintedLoading || !whitelist.includes(address)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded w-[150px]" onClick={handleMint}>
        {isPendingMint || isMintedLoading ? "Minting..." : "Mint"}
      </button>
      <button disabled={isPendingApprove || isApproveLoading || isPendingFreeMint || isFreeMintedLoading} className="bg-blue-500 text-white font-bold py-2 px-4 rounded w-[150px] mt-2" onClick={handleFreeMint}>
        {isPendingApprove || isApproveLoading ? "Approving..." : isPendingFreeMint || isFreeMintedLoading ? "Free Minting..." : 'Free Mint'}
      </button>

      <div className="flex flex-col mt-5">
        <div className="flex flex-row">
          <input className="bg-gray-200 rounded w-[120px] mr-2 py-2 px-4" type="number" placeholder="Token Id" onChange={(e) => setTokenId(parseInt(e.target.value))} />
          <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded w-[350px] mt-2 ml-2" onClick={getTokenURI}>GET TOKEN URI</button>
        </div>
        {isTokenURISuccess && typeof tokenURI === "string" ? <a href={tokenURI} target="_blank" rel="noreferrer" className="mt-2 text-white text-center">{tokenURI}</a> : null}
      </div> */}

        <section className={`flex flex-col justify-center items-center ${styles.topContent}`}>
          <p>KLK Genesis Pass</p>
          <p>KLK Genesis NFT is one of the first unique utility NFTs in the KLK ecosystem, with a total supply of 100,000 pieces.
            It carries scarcity, collectible value, and exclusive benefits. As an essential part of the KLK ecosystem's development, the Genesis NFT not only represents the vision of the KLK brand but will also provide tangible returns and long-term value to its holders.</p>
        </section>

        <section className={`${styles.mintSection} flex flex-col items-start justify-start`}>
          <p className={styles.mintTitle}>KLK Genesis Pass</p>

          <div className={`flex flex-col items-center justify-center ${styles.progressContainer}`}>
            <div className={`${styles.mintCount} flex flex-row w-full items-center justify-between`}>
              <p>${isWhiteStage ? Number(mintedCount / 20250 * 100).toFixed(2) : Number(mintedCount / 79750 * 100).toFixed(2) }% Minted</p>
              <p>{mintedCount}/{isWhiteStage ? 20250 : 79750}</p>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{ width: `${isWhiteStage ? Number(mintedCount / 20250 * 100).toFixed(2) : Number(mintedCount / 79750 * 100).toFixed(2)}%` }}></div>
            </div>
          </div>


          <div className={`${styles.mintPrice}`}>
            <div className={`${styles.price} flex flex-row items-center justify-between`}>
              <p>Mint Price</p>
              <p>${isWhiteStage ? 0 : 10}</p>
            </div>

            <div className={`${styles.handles} flex flex-row items-center justify-between`}>
              <button className={`${styles.checkBtn}`} onClick={() => handleCheck()}>Check</button>
              {!isConnected && <ConnectButton_custom isPage={true} />}

              {isConnected && isWhiteStage ? <button className={`${styles.mintBtn}`} disabled={isPendingMint || isMintedLoading || !canMint} onClick={handleMint}>
                {
                  isPendingMint || isMintedLoading ? "Minting..." : "Mint"
                }
              </button> : isConnected && isPublicStage ? <button className={`${styles.mintBtn}`} disabled={isPendingApprove || isApproveLoading || isPendingFreeMint || isFreeMintedLoading} onClick={handleFreeMint}>
                {
                  isPendingApprove || isApproveLoading ? "Approving..." : isPendingFreeMint || isFreeMintedLoading ? "Minting..." : "Mint"
                }
              </button> : null}

            </div>

            <div className={`${styles.handles} flex flex-row items-center justify-between mt-2`}>
              <p className={`${styles.times} flex items-center justify-center`}>
                {is_whiteList || !isCheck ? `You can still mint ${isCheck && times ? Number(times) : 0} times` : !is_whiteList && isCheck ? "You are not whitelisted." : ""}
              </p>
              <Link className={`${styles.toMarketBtn} flex items-center justify-center`} href={"/marketplace"} >{'To Marketplace >'}</Link>
            </div>
          </div>


          <div className={styles.timeline}>
            <p className={styles.timelineTitle}>Release Timeline</p>
            <div className={`${styles.stageType} flex flex-row items-center justify-between`}>
              <div className="flex flex-row items-center">
                <span className={styles.dot} style={isWhiteStage ? { backgroundColor: "#6EF000" } : {}}></span>
                <p className={styles.stageTitle}>Whitelist Stage</p>
              </div>

              <p className={styles.date}>UTC 2025.02.01 12:00:00</p>
            </div>

            <div className={`${styles.stageType} flex flex-row items-center justify-between`}>
              <div className="flex flex-row items-center">
                <span className={styles.dot} style={isPublicStage ? { backgroundColor: "#6EF000" } : {}}></span>
                <p className={styles.stageTitle}>Public Stage <span>10USDT</span></p>
              </div>

              <p className={styles.date}>UTC 2025.03.01 12:00:00</p>
            </div>
          </div>

        </section>

        <img src="/images/homeBg.png" className={styles.bgImg} alt="" />


        <section className={`${styles.faqSection} flex flex-col w-full`}>
          <p className={styles.faqTitle}>Question and Answer</p>
          <div>
            <p className={styles.faqQuestionTit}>How to get it?</p>
            <p className={styles.faqContent}>
              Follow KLK's social media, and we will distribute whitelist spots through various activities.
              <br />
              If you don't have a whitelist spot, you can also purchase one during the public sale.
            </p>
          </div>
          <div>
            <p className={styles.faqQuestionTit}>Total supply?</p>
            <p className={styles.faqContent}>The total supply of KLK Genesis Pass is 100,000, of which 20,250 will be distributed through collaboration with partner communities, ecosystem projects, and influencers, granting WL qualifications. Please follow the official Twitter of KLK Foundation for real-time updates on activities. After the WL event concludes, the remaining 79,750 will be available for public minting, where anyone has the opportunity to mint. If WL qualification holders fail to complete minting within the specified time, their qualifications will be invalidated, but they can still mint during the public phase. Each address has 5 minting opportunities.</p>
          </div>

          <div>
            <p className={styles.faqQuestionTit}>What are the benefits of Lightcycle OG NFT ?</p>
            <p className={styles.faqContent}>
              KLK Genesis NFTs are the first batch of unique rights-based NFTs within the KLK ecosystem. With a total supply of 100,000, they possess rarity, collectible value, and exclusive rights. As an important part of the KLK ecosystem's development, the Genesis NFTs not only represent the vision of the KLK brand but will also provide holders with tangible returns and long-term value.

              <span>Exclusive Rights and Airdrop Rewards</span>
              Each Genesis NFT will receive an airdrop reward of 10 KLK tokens, providing initial profits to holders.

              <span>Unique Design and Collectible Value</span>
              Each Genesis NFT is independently designed, incorporating elements of Web3 finance, blockchain innovation, and future vision, showcasing the unique style of the KLK brand.

              <span>Multiple Gameplay and Incentive Mechanism</span>
              Holders will participate in lottery and card collection activities based on on-chain transaction hashes, with the chance to share up to 10% of NFT revenues. The design of the incentive mechanisms not only increases the fun of the activities but also provides users with generous rewards. All proceeds from NFT sales will be used for incentive activities.
            </p>
          </div>
        </section>
      </div>

      <img src="/images/footBg.png" className={styles.footImg} alt="" />

    </div>

  );
}
