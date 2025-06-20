import goblin from '../assets/images/goblin.png'
import orc from '../assets/images/orc1.png'
import dragao from '../assets/images/dragao1.png'
import guarda from '../assets/images/guarda1.png'

export const enemies = [
  {
    id: 1,
    name: 'Goblin Berserk',
    level: 3,
    hp: 250,
    attack: 25,
    defense: 30,
    critChance: 10,
    attackSpeed: 1,
    image: goblin,
    rewardXP: 150,
    rewardGoldMultiplier: 1
  },
  {
    id: 2,
    name: 'Wild Orc',
    level: 15,
    hp: 500,           
    attack: 45,       
    defense: 60,       
    critChance: 20,     
    attackSpeed: 1.5,    
    image: orc, 
    rewardXP: 300,     
    rewardGoldMultiplier: 1.5 
  },
  {
    id: 3,
    name: 'Ancient Dragon',
    level: 30,
    hp: 1000,           
    attack: 90,       
    defense: 120,       
    critChance: 30,    
    attackSpeed: 2,    
    image: dragao, 
    rewardXP: 6000,     
    rewardGoldMultiplier: 2
  },
   {
    id: 4,
    name: 'Kings Guard',
    level: 50,
    hp: 1800,           
    attack: 200,       
    defense: 150,       
    critChance: 40,    
    attackSpeed: 2.5,    
    image: guarda, 
    rewardXP: 200000,     
    rewardGoldMultiplier: 2.5
  }
];