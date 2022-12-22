import {ethers} from "ethers"
import axios from 'axios'
import nodeNotifier from "node-notifier";
import open from 'open'
import {createObjectCsvWriter} from 'csv-writer' ;
import csv from 'csv-parser'
import fs from 'fs'

const providerPolygon = new ethers.providers.StaticJsonRpcProvider(
    "https://polygon-rpc.com/", 
    {
      chainId: 137,
      name: "Polygon",
    }
  );

  let abiPoly = [
    "function totalSupply() external view returns (uint256)",
    "function __maxTicketSupply() public view returns (string)",
    "event Mint_Ticket_Success(address indexed _from, uint _recipeId)",
]

let abiMix = [
    "event Mint_Ticket_Success(address indexed _from, uint _recipeId)",
    "event Mint_Recipe_Success(address indexed _from, uint _recipe_id, bytes _signature, uint[] _ingredients)",
    "event Mint_Recipe_Failed(address indexed _from, uint[] _ingredients)",
    "event New_Recipe_Discovered(address indexed _from, uint _recipe_id)",
]

let testABI = [
    "event Mint_Recipe_Failed(address indexed _from, uint[] _ingredients)",
]

async function listenSmurfTickets(){

    let smurfTicketAddress = "0xBaC7E3182BB6691F180Ef91f7Ae4530Abb3dc08D"
    let smurfTicketContract = new ethers.Contract(smurfTicketAddress, abiPoly, providerPolygon)

    let smurfMixAddress = "0x48c75FbF0452fA8FF2928Ddf46B0fE7629cCa2FF"
    let smurfMixContract = new ethers.Contract(smurfMixAddress, abiMix, providerPolygon)

    smurfTicketContract.on("Mint_Ticket_Success", async(_from, _recipeId, event) => {
        console.log("NEW CRYSTAL :"+Number(_recipeId))

        console.log("https://polygonscan.com/tx/"+event.transactionHash)
        console.log("\n") 

        nodeNotifier.notify({
            title: 'CRYSTAL MINTED',
            message: Number(_recipeId),
            sound: true,
            wait: true,
          });
    })

    smurfMixContract.on("New_Recipe_Discovered", async(_from, _recipeId, event) => {
        console.log("NEW RECIPE :"+_recipeId)

        console.log("https://polygonscan.com/tx/"+event.transactionHash)
        console.log("\n") 

        nodeNotifier.notify({
            title: 'NEW RECIPE',
            message: data.name,
            sound: true,
            wait: true,
          });

    })

    smurfMixContract.on("Mint_Recipe_Success", async(from, _recipe_id,_signature, _ingredients, event) => {
        console.log("Mint_Recipe_Success")
        let recipe = "["
        for (let index = 0; index < _ingredients.length; index++) {
            const url = "https://app.thesmurfssociety.com/metadata/public/metadata/cauldron/"+(Number(_ingredients[index]).toString());
            const { data } = await axios.get(url);
            index < (_ingredients.length-1) ? recipe += (data.name) + ", " : recipe += (data.name) + "]"
        }
        console.log(recipe)
        console.log("\n")     
    })  

    /*let currentBlock = await providerPolygon.getBlockNumber()
    let events = await smurfTicketContract.queryFilter('Mint_Ticket_Success', currentBlock-10000, currentBlock);

    let recipes = []
    events.map((item, index) => {
        let ingredients = item.args._ingredients
        let recipe = []
        ingredients.map((item, index) => {
            //recipe +=  (Number(item)).toString() + "|"
            recipe.push(Number(item))
        })
        recipes.push({"failedRecipe":recipe})
    });
    console.log(recipes)

    let recipes = []
    events.map((item, index) => {
        let ingredients = item.args._ingredients
        let recipe = []
        ingredients.map((item, index) => {
            //recipe +=  (Number(item)).toString() + "|"
            recipe.push(Number(item))
        })
        recipes.push(recipe)
    });

    let test = [12,7,14]
      console.log(recipes)
    for (let index = 0; index < recipes.length; index++) {
        if((test[0] == recipes[index][0] || test[0] == recipes[index][1] || test[0] == recipes[index][2])
            && (test[1] == recipes[index][0] || test[1] == recipes[index][1] || test[1] == recipes[index][2])
            && (test[2] == recipes[index][0] || test[2] == recipes[index][1] || test[2] == recipes[index][2])) {
                console.log(recipes[index])
            }
    }

   loadCSV()*/
}

function exportToCSV(recipes) {
    let createCsvWriter = createObjectCsvWriter({
        path: 'test.csv',
        header: [
          {id: 'failedRecipe', title: 'Failed recipes'},
        ]
      })

      createCsvWriter
        .writeRecords(recipes)
        .then(()=> console.log('The CSV file was written successfully'));
}

function loadCSV() {
    fs.createReadStream('test.csv')
    .pipe(csv())
    .on('data', (row) => {
      console.log(row);
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    });
}

listenSmurfTickets()