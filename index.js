import {ethers} from "ethers"
import axios from 'axios'
import nodeNotifier from "node-notifier";
import open from 'open'

const providerPolygon = new ethers.providers.StaticJsonRpcProvider(
    "https://polygon-rpc.com/", 
    {
      chainId: 137,
      name: "Polygon",
    }
  );

  /*let abiPoly = [
    "function totalSupply() external view returns (uint256)",
]*/

let abiMix = [
    "event Mint_Ticket_Success(address indexed _from, uint _recipeId)",
    "event Mint_Recipe_Success(address indexed _from, uint _recipe_id, bytes _signature, uint[] _ingredients)",
    "event Mint_Recipe_Failed(address indexed _from, uint[] _ingredients)"
]

async function listenSmurfTickets(){

    /*let smurfTicketAddress = "0xBaC7E3182BB6691F180Ef91f7Ae4530Abb3dc08D"
    let smurfTicketContract = new ethers.Contract(smurfTicketAddress, abiPoly, providerPolygon)
    let supply = await smurfTicketContract.totalSupply()*/

    let smurfMixAddress = "0x48c75FbF0452fA8FF2928Ddf46B0fE7629cCa2FF"
    let smurfMixContract = new ethers.Contract(smurfMixAddress, abiMix, providerPolygon)

    smurfMixContract.on("Mint_Recipe_Failed", async(from, _ingredients) => {
        console.log("Mint_Recipe_Failed")
    })

    smurfMixContract.on("Mint_Recipe_Success", async(from, _recipe_id,_signature, _ingredients) => {
        console.log("Mint_Recipe_Success")
        let recipe = "["
        for (let index = 0; index < _ingredients.length; index++) {
            const url = "https://app.thesmurfssociety.com/metadata/public/metadata/cauldron/"+(Number(_ingredients[index]).toString());
            const { data } = await axios.get(url);
            index < (_ingredients.length-1) ? recipe += (data.name) + ", " : recipe += (data.name) + "]"
        }
        console.log(recipe)
        console.log("\n")

        nodeNotifier.notify({
            title: 'Recipe success',
            message: recipe,
            sound: true,
            wait: true,
          });

          nodeNotifier.on('click', function () {
            open("https://opensea.io/assets/matic/0x48c75fbf0452fa8ff2928ddf46b0fe7629cca2ff/"+_recipe_id);
        });

          
    })

    smurfMixContract.on("Mint_Ticket_Success", async(_from, _recipeId) => {
        console.log("NEW CRYSTAL :"+_recipeId)

        nodeNotifier.notify({
            title: 'CRYSTAL MINTED',
            message: _recipeId,
            sound: true,
            wait: true,
          });
    })

}

listenSmurfTickets()

