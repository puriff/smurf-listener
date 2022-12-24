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
    "event Mint_Recipe_Success(address indexed _from, uint _recipe_id, bytes _signature, uint[] _ingredients)",
    "event Mint_Recipe_Failed(address indexed _from, uint[] _ingredients)",
    "event New_Recipe_Discovered(address indexed _from, uint _recipe_id)",
]

let testABI = [
    "event Mint_Recipe_Failed(address indexed _from, uint[] _ingredients)",
]

let ingredientList = [
  "Blue Clay",
  "Rain drop",
  "Daisies",
  "Sarsaparilla",
  "Tuberose Flowers",
  "Forest Mushrooms",
  "Cork Bark",
  "Butterfly Chrysalis",
  "Hedgehog Spines",
  "Squirrel's Loot",
  "Sticky Honey",
  "Juicy Grubs",
  "Loona Dust",
  "Howlibird's egg",
  "Rainbow Broth",
  "Horn of an Angry Bull",
  "Swaddling Cloth",
  "Shooting Star Powder",
  "Strange Cube",
  "Carnivorous Plant Saliva",
  "Love Potion",
  "Red Beans"
]

let smurfTicketAddress = "0xBaC7E3182BB6691F180Ef91f7Ae4530Abb3dc08D"
let smurfTicketContract = new ethers.Contract(smurfTicketAddress, abiPoly, providerPolygon)

let smurfMixAddress = "0x48c75FbF0452fA8FF2928Ddf46B0fE7629cCa2FF"
let smurfMixContract = new ethers.Contract(smurfMixAddress, abiMix, providerPolygon)

async function listenSmurfTickets(){

    smurfTicketContract.on("Mint_Ticket_Success", async(_from, _recipeId, event) => {
        console.log("")
        console.log('------------------------------------')
        console.log("NEW CRYSTAL :"+Number(_recipeId))

        console.log("https://polygonscan.com/tx/"+event.transactionHash)

        let currentBlock = event.blockNumber
        let lastTicketMint = _recipeId
        //RETURN LIST OF RECIPE DISCOVERY, IF SMURF MINT NUMBER != 1, THE TWO BLOCKS AT WHICH EVENTS WERE TRIGGERED
          //WILL BE DIFFERENT
          let newRecipeEvent = await smurfMixContract.queryFilter('New_Recipe_Discovered', currentBlock-10000, currentBlock);
          //LOOP THROUGH LAST RECIPE DISCOVERY EVENTS
          for (let index = 0; index < newRecipeEvent.length; index++) {
            //GET RECIPE ID
            let recipeID = Number(newRecipeEvent[index].args._recipe_id)
            //IF RECIPE ID == LAST TICKET MINT => GET INGREDIENTS
            if(recipeID == lastTicketMint) {
              let eventBlock = newRecipeEvent[index].blockNumber
              //query block at which newest recipe was discovered, for the mint success event
              let mintRecipeEvent = await smurfMixContract.queryFilter('Mint_Recipe_Success', eventBlock, eventBlock);
              //loop through list of that event that happened in the block
              for (let index = 0; index < mintRecipeEvent.length; index++) {
                //if finds an event with same recipe ID created as newest recipe
                if(Number(mintRecipeEvent[index].args._recipe_id) == recipeID)
                  {
                    //get ingredient
                    let ingredients = mintRecipeEvent[index].args._ingredients
                    getRecipe(ingredients, eventBlock, "Ticket recipe")
                  }
              }
            }
          }

          nodeNotifier.notify({
              title: 'CRYSTAL MINTED',
              message: Number(_recipeId),
              sound: true,
              wait: true,
            });
    })

    smurfMixContract.on("New_Recipe_Discovered", async(_from, _recipeId, event) => {
        console.log("")
        console.log('------------------------------------')
        console.log("NEW RECIPE :"+_recipeId)

        const url = "https://app.thesmurfssociety.com/metadata/public/metadata/cauldron/"+(Number(_recipeId).toString());
          const { data } = await axios.get(url);

        let currentBlock = event.blockNumber
        //query block at which newest recipe was discovered, for the mint success event
        let mintRecipeEvent = await smurfMixContract.queryFilter('Mint_Recipe_Success', currentBlock, currentBlock);
        //loop through list of that event that happened in the block
        for (let index = 0; index < mintRecipeEvent.length; index++) {
          //if finds an event with same recipe ID created as newest recipe
          if(Number(mintRecipeEvent[index].args._recipe_id) == Number(_recipeId))
            {
              //get ingredient
              let ingredients = mintRecipeEvent[index].args._ingredients
              getRecipe(currentBlock, ingredients, "New recipe")
            }
        }
        console.log("https://polygonscan.com/tx/"+event.transactionHash)
        console.log('------------------------------------')

        nodeNotifier.notify({
            title: 'NEW RECIPE',
            message: data.name,
            sound: true,
            wait: true,
          });
    })

    smurfMixContract.on("Mint_Recipe_Success", async(from, _recipe_id,_signature, _ingredients, event) => {
        console.log("")
        console.log('------------------------------------')
        console.log("Mint_Recipe_Success : " + _recipe_id)

        let currentBlock = event.blockNumber
        getRecipe(currentBlock, _ingredients, "Minted recipe")
      })

    //RETURN LAST MINT TICKET EVENT
    /*let currentBlock = await providerPolygon.getBlockNumber()
    let events = await smurfTicketContract.queryFilter('Mint_Ticket_Success', currentBlock-50000, currentBlock);
    let lastTicketMint = Number(events[events.length-1].args._recipeId)
    console.log("Last ticket recipe ID : " +lastTicketMint)
    
    //RETURN LIST OF RECIPE DISCOVERY, IF SMURF MINT NUMBER != 1, THE TWO BLOCKS AT WHICH EVENTS WERE TRIGGERED
    //WILL BE DIFFERENT
    let newRecipeEvent = await smurfMixContract.queryFilter('New_Recipe_Discovered', currentBlock-50000, currentBlock);
    //LOOP THROUGH LAST RECIPE DISCOVERY EVENTS
    for (let index = 0; index < newRecipeEvent.length; index++) {
      //GET RECIPE ID
      let recipeID = Number(newRecipeEvent[index].args._recipe_id)
      //IF RECIPE ID == LAST TICKET MINT => GET INGREDIENTS
      if(recipeID == lastTicketMint) {
        let eventBlock = newRecipeEvent[index].blockNumber
        //query block at which newest recipe was discovered, for the mint success event
        let mintRecipeEvent = await smurfMixContract.queryFilter('Mint_Recipe_Success', eventBlock, eventBlock);
        //loop through list of that event that happened in the block
        for (let index = 0; index < mintRecipeEvent.length; index++) {
          //if finds an event with same recipe ID created as newest recipe
          if(Number(mintRecipeEvent[index].args._recipe_id) == recipeID)
            {
              //get ingredient
              let ingredients = mintRecipeEvent[index].args._ingredients
              let recipe = ""
              for (let index = 0; index < ingredients.length; index++) {
                  (ingredients[index] > 99) ? recipe += Number(ingredients[index]) : recipe += ingredientList[Number(ingredients[index])]
                  if(index < ingredients.length -1) {
                    recipe += " | "
                  } 
              }
              console.log("Ticket recipe is : " +recipe)

              for (let index = 0; index < ingredients.length; index++) {
                //check if there's a potion in the recipe
                if(Number(ingredients[index]) > 99) {
                  console.log(Number(ingredients[index]) +" is a Potion")
                  getPotionIngredients(currentBlock, Number(ingredients[index]))
                }
              }
            }
        }
      }
    }*/
    

    /*let fullRecipe = []
    //query block at which newest recipe was discovered, for the mint success event
    let mintRecipeEvent = await smurfMixContract.queryFilter('Mint_Recipe_Success', eventBlock, eventBlock);
    //loop through list of that event that happened in the block
    for (let index = 0; index < mintRecipeEvent.length; index++) {
      //if finds an event with same recipe ID created as newest recipe
      if(Number(mintRecipeEvent[index].args._recipe_id) == Number(newRecipeEvent[newRecipeEvent.length-1].args._recipe_id))
        {
          //get ingredient
          let ingredients = mintRecipeEvent[index].args._ingredients
          for (let index = 0; index < ingredients.length; index++) {
            //check if there's a potion in the recipe
            if(Number(ingredients[index]) > 99) {
              console.log(Number(ingredients[index]) +" is a Potion")
              getPotionIngredients(currentBlock, Number(ingredients[index]))
            }
            //return list of ingredients
            fullRecipe.push(Number(ingredients[index]))
          }
        }
    }
  console.log("Last recipe found : " +fullRecipe)*/
}

async function getRecipe(blockNumber, ingredients, message) {
  let recipe = ""
  for (let index = 0; index < ingredients.length; index++) {
      (ingredients[index] > 99) ? recipe += Number(ingredients[index]) : recipe += ingredientList[Number(ingredients[index])]
      if(index < ingredients.length -1) {
        recipe += " | "
      } 
  }
  console.log(message + " is : " +recipe)

  for (let index = 0; index < ingredients.length; index++) {
    //check if there's a potion in the recipe
    if(Number(ingredients[index]) > 99) {
      console.log(Number(ingredients[index]) +" is a Potion")
      getPotionIngredients(blockNumber, Number(ingredients[index]))
    }
  }
}

//there is a potion in latest recipe list, so need to get ingredient of that potion aswell
async function getPotionIngredients(currentBlock, lastRecipeFound) {
  //query pas blocks, to find tx where recipe id = recipe we need to find list of ingredients for
  let pastEvents = await smurfMixContract.queryFilter("Mint_Recipe_Success", currentBlock-10000, currentBlock);
  //loop through events
  for (let index = 0; index < pastEvents.length; index++) {
    //check if recipe minted id = recipe we're looking for
    if(Number(pastEvents[index].args._recipe_id) == lastRecipeFound) {
      //get ingredients from potion
      let ingredients = pastEvents[index].args._ingredients
      let recipe = ""
      for (let index = 0; index < ingredients.length; index++) {
          (ingredients[index] > 99) ? recipe += Number(ingredients[index]) : recipe += ingredientList[Number(ingredients[index])]
          if(index < ingredients.length -1) {
            recipe += " | "
          } 
      }
      console.log("Potion " + lastRecipeFound + " recipe is : " +recipe)
      //check if there's a potion in those ingredients
      for (let index = 0; index < ingredients.length; index++) {
        //if yes, we start agane
        if(Number(ingredients[index]) > 99 ) {
          console.log(Number(ingredients[index]) + " is a potion")
          getPotionIngredients(currentBlock, Number(ingredients[index]))
        }
      }
      break;
    }
  }
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


    

    //check recipe_ID
    //if same
    //get ingredients
    //IF POTION in ingredients
    //filter past event that minted said potion
    //get ingredients


    /*let recipes = []
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