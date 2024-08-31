  import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  import { DEFAULT_SOL_AMOUNT , getDefaultOrUserPubKey} from "./const";



  export const GET = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const { toPubkey } = await validatedQueryParams(requestUrl);

      const baseHref = new URL(
        `/api/donate?to=${toPubkey.toBase58()}`,
        requestUrl.origin,
      ).toString();

      const payload: ActionGetResponse = {
        title: "Transfer Native SOL",
        icon: "https://i.ibb.co/Zf5Fctp/Screenshot-2024-08-24-181920.png",
        description: "Transfer SOL to author",
        label: "Transfer", // this value will be ignored since `links.actions` exists
        links: {
          actions: [
            {
              label: "Send 1 SOL", // button text
              href: `${baseHref}&amount=${"1"}`,
            },
            {
              label: "Send 5 SOL", // button text
              href: `${baseHref}&amount=${"5"}`,
            },


            {
              label: "Send 10 SOL", // button text
              href: `${baseHref}&amount=${"10"}`,
            },
            {
              label: "Send SOL", // button text
              href: `${baseHref}&amount={amount}`, // this href will have a text input
              parameters: [
                {
                  name: "amount", // parameter name in the `href` above
                  label: "Enter the amount of SOL to send", // placeholder of the text input
                  required: true,
                },
              ],
            },
          ],
        },
        type: "action"
      };

      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
  };
  export async function OPTIONS(request:Request) {
    return new Response(null, {headers:ACTIONS_CORS_HEADERS})
  }
  // DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
  // // THIS WILL ENSURE CORS WORKS FOR BLINKS
  // export const OPTIONS = GET;

  export const POST = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const { amount, toPubkey } = await validatedQueryParams(requestUrl);

      const body: ActionPostRequest = await req.json();

      // validate the client provided input
      let account: PublicKey;
      try {
        account = new PublicKey(body.account);
      } catch (err) {
        return new Response('Invalid "account" provided', {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        });
      }

      const connection = new Connection(
        process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
      );

      // ensure the receiving account will be rent exempt
      const minimumBalance = await connection.getMinimumBalanceForRentExemption(
        0, // note: simple accounts that just store native SOL have `0` bytes of data
      );
      if (amount * LAMPORTS_PER_SOL < minimumBalance) {
        throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
      }

      // create an instruction to transfer native SOL from one wallet to another
      const transferSolInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      });

      // get the latest blockhash amd block height
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      // create a legacy transaction
      const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
      }).add(transferSolInstruction);

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `Send ${amount} SOL to ${toPubkey.toBase58()}`,
        },
        // note: no additional signers are needed
        // signers: [],
      });

      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
  };

  async function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey = await getDefaultOrUserPubKey();
    let amount: number = DEFAULT_SOL_AMOUNT;

    try {
      if (requestUrl.searchParams.get("to")) {
        toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
      }
    } catch (err) {
      throw "Invalid input query parameter: to";
    }

    try {
      if (requestUrl.searchParams.get("amount")) {
        amount = parseFloat(requestUrl.searchParams.get("amount")!);
      }

      if (amount <= 0) throw "amount is too small";
    } catch (err) {
      throw "Invalid input query parameter: amount";
    }

    return {
      amount,
      toPubkey,
    };
  }




  // export async function GET(request:Request) {
  //   const response: ActionGetResponse = {
  //     title: "Transfer Native SOL",
  //     icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7dPPWr-BRKzBy_Fig0v_snt-_onQj9Pl5xA&s",
  //     description: "Transfer SOL to ANKIT",
  //     label: "Transfer", // this value will be ignored since `links.actions` exists
  //     error: {
  //       message: "Hello Ankit"
  //     },
  //     type: "action"
  //   }
  //   return Response.json(response, {
  //     headers: ACTIONS_CORS_HEADERS
  //   })

  
  //         }

  //         // export const OPTIONS = GET;

  // export async function OPTIONS(request: Request){
  //   return new Response(null, {headers: ACTIONS_CORS_HEADERS})
  // }


  //         export async function POST(request:Request) {
  //           const userPubKey = postRequest.account
  // const response: ActionPostResponse ={
  //   transaction: "",
  //   message: "hello" + userPubKey
  // }
  // return Response.json(response, {headers: ACTIONS_CORS_HEADERS})
  //         }