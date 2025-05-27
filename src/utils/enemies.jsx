import goblin from '../assets/images/goblin.png'
import orc from '../assets/images/orc1.png'
import dragao from '../assets/images/dragao1.png'

export const enemies = [
  {
    id: 1,
    name: 'Goblin Berserker',
    level: 1,
    hp: 80,
    attack: 16,
    defense: 30,
    critChance: 10,
    attackSpeed: 1,
    image: goblin,
    rewardXP: 150,
    rewardGoldMultiplier: 100
  },
  {
    id: 2,
    name: 'Orc Selvagem',
    level: 2,
    hp: 160,           
    attack: 32,       
    defense: 60,       
    critChance: 20,     
    attackSpeed: 1.5,    
    image: orc, 
    rewardXP: 300,     
    rewardGoldMultiplier: 1.5 
  },
  {
    id: 3,
    name: 'Dragão Ancião',
    level: 4,
    hp: 320,           
    attack: 64,       
    defense: 120,       
    critChance: 40,    
    attackSpeed: 2,    
    image: dragao, 
    rewardXP: 600,     
    rewardGoldMultiplier: 3 
  },
   {
    id: 4,
    name: 'Guarda Real',
    level: 8,
    hp: 800,           
    attack: 100,       
    defense: 200,       
    critChance: 50,    
    attackSpeed: 3,    
    image: dragao, 
    rewardXP: 2000,     
    rewardGoldMultiplier: 3 
  }
];