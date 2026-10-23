// Care services offered at The Helsy Bentota.
import { LuHeartHandshake, LuHouse, LuLeaf, LuSunrise } from 'react-icons/lu'

export const careServices = [
  {
    id: 'residential',
    Icon: LuHouse,
    title: 'Residential Care',
    text: 'A warm, homely place to live, with help with daily living, home-cooked meals from our own kitchen and garden, and a caring team who get to know every resident.',
  },
  {
    id: 'dementia',
    Icon: LuHeartHandshake,
    title: 'Dementia Care',
    text: 'Patient, person-centred care for people living with dementia, in calm and safe surroundings with a familiar daily routine and plenty of time outdoors.',
  },
  {
    id: 'respite',
    Icon: LuSunrise,
    title: 'Respite Care',
    text: 'Short stays that give family carers a well-earned break, knowing their loved one is comfortable, safe and well looked after.',
  },
  {
    id: 'ayurveda',
    Icon: LuLeaf,
    title: 'Ayurvedic Medicine',
    text: 'Traditional Ayurvedic treatment under consultant care – prescribed and supervised by a qualified Ayurvedic consultant, alongside each resident’s regular care.',
  },
]
