// Broad agro-climatic orientation for the 13 districts of Uttarakhand.
// This is NOT authoritative data. It only gives the model a starting point so
// it does not treat a Tarai district like a high-hill district. Every entry
// should be checked against district KVK / state agriculture department
// material before the project is shown as "validated".

export const DISTRICTS = {
  "Almora": {
    division: "Kumaon",
    terrain: "Mostly mid hills (roughly 1000-2000 m) with terraced, largely rain-fed fields; a few irrigated river valleys.",
    commonCrops: "Finger millet (mandua), barnyard millet (jhangora), wheat, paddy in irrigated valleys, horse gram (gahat), black soybean (bhat), rajma, potato, seasonal vegetables, some temperate fruits at higher sites.",
    notes: "ICAR-VPKAS (Vivekananda Parvatiya Krishi Anusandhan Sansthan) is located in Almora and works on hill crop varieties.",
  },
  "Bageshwar": {
    division: "Kumaon",
    terrain: "Mid to high hills; irrigated valley land (e.g. Katyur valley) plus rain-fed terraces on slopes.",
    commonCrops: "Paddy and wheat in valleys, finger millet, barnyard millet, rajma, potato, pulses, vegetables.",
    notes: "",
  },
  "Chamoli": {
    division: "Garhwal",
    terrain: "Mid to very high hills; large altitude range from river valleys to high alpine villages with a short growing season.",
    commonCrops: "Potato and rajma at higher altitudes, amaranth (chaulai), buckwheat (kuttu), finger millet, barnyard millet, paddy and wheat in lower valleys, apple at suitable high sites.",
    notes: "Snow and frost limit the season in upper areas.",
  },
  "Champawat": {
    division: "Kumaon",
    terrain: "Mostly mid hills; the southern edge (around Tanakpur) is low foothill/bhabar land.",
    commonCrops: "Finger millet, barnyard millet, wheat, paddy, pulses and vegetables in the hills; paddy, wheat, sugarcane and vegetables in the Tanakpur foothills.",
    notes: "",
  },
  "Dehradun": {
    division: "Garhwal",
    terrain: "Doon valley (sub-tropical valley, mostly irrigated) plus the Chakrata / Jaunsar-Bawar hills in the north-west.",
    commonCrops: "Valley: paddy (including basmati), wheat, maize, vegetables, litchi, mango. Hills: ginger, potato, tomato, peas, rajma, millets, temperate fruits at higher sites.",
    notes: "",
  },
  "Haridwar": {
    division: "Garhwal",
    terrain: "Gangetic plains, irrigated, hot summers.",
    commonCrops: "Sugarcane, wheat, paddy, maize, mustard, vegetables, fodder crops, poplar agroforestry.",
    notes: "",
  },
  "Nainital": {
    division: "Kumaon",
    terrain: "Two very different parts: Bhabar/Tarai plains in the south (Haldwani, Ramnagar) and mid-high hills in the north (Ramgarh, Mukteshwar, Dhari).",
    commonCrops: "Plains: paddy, wheat, sugarcane, vegetables, mango, litchi. Hills: temperate fruits (peach, plum, apricot, pear, apple), potato, peas and other off-season vegetables.",
    notes: "Always ask whether the farmer is in the plains part or the hill part.",
  },
  "Pauri Garhwal": {
    division: "Garhwal",
    terrain: "Mostly mid hills with rain-fed terraces; foothill land around Kotdwar in the south.",
    commonCrops: "Finger millet, barnyard millet, wheat, paddy in valleys, pulses, vegetables; Kotdwar area grows plains crops.",
    notes: "VCSG Uttarakhand University of Horticulture and Forestry is at Bharsar in this district. Out-migration has left many fields fallow, so monkey/wild boar damage is a frequent problem.",
  },
  "Pithoragarh": {
    division: "Kumaon",
    terrain: "Mid hills in the south to very high hills near the Tibet/Nepal border (Munsiyari, Dharchula).",
    commonCrops: "Rajma (Munsiyari is known for it), potato, finger millet, barnyard millet, amaranth, buckwheat, paddy and wheat in valleys.",
    notes: "",
  },
  "Rudraprayag": {
    division: "Garhwal",
    terrain: "Mid to high hills along the Mandakini and Alaknanda valleys.",
    commonCrops: "Paddy in valleys, finger millet, barnyard millet, wheat, rajma, potato, amaranth, vegetables.",
    notes: "",
  },
  "Tehri Garhwal": {
    division: "Garhwal",
    terrain: "Mid to high hills; river valleys plus rain-fed slopes.",
    commonCrops: "Finger millet, barnyard millet, wheat, paddy in valleys, rajma, potato, peas, tomato and other vegetables, some temperate fruits.",
    notes: "",
  },
  "Udham Singh Nagar": {
    division: "Kumaon",
    terrain: "Tarai plains, fertile and mostly irrigated, with a high water table.",
    commonCrops: "Paddy, wheat, sugarcane, maize, mustard/toria, lentil and other pulses, vegetables, poplar agroforestry.",
    notes: "G.B. Pant University of Agriculture and Technology is at Pantnagar in this district.",
  },
  "Uttarkashi": {
    division: "Garhwal",
    terrain: "High hills with a wide altitude range, from the Yamuna/Bhagirathi valleys to high villages such as Harsil.",
    commonCrops: "Apple (Harsil area), rajma, potato, amaranth, buckwheat, finger millet, barnyard millet; red rice in the Purola area.",
    notes: "",
  },
};

export const DISTRICT_NAMES = Object.keys(DISTRICTS);

export function districtBrief(name) {
  const d = DISTRICTS[name];
  if (!d) return "";
  return [
    `District: ${name} (${d.division} division)`,
    `Terrain: ${d.terrain}`,
    `Crops commonly grown: ${d.commonCrops}`,
    d.notes ? `Notes: ${d.notes}` : "",
  ].filter(Boolean).join("\n");
}
