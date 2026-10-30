// V8's painted-map coordinates, not a longitude/latitude projection.
export const introCultures = [
 {id:'iceland',name:'冰島',title:'窗台上的聖誕驚喜',tradition:'13 位聖誕小精靈',x:132/1728*100,y:276/947*100,description:'聖誕節前，冰島的孩子會把鞋子放在窗台上。傳說中，13 位聖誕小精靈會輪流拜訪，留下糖果、小禮物，或一顆讓人哭笑不得的馬鈴薯。',note:'這是冰島民間傳說中的聖誕習俗。',action:'看看鞋子裡有什麼'},
 {id:'taiwan',name:'台灣',title:'把驚喜送給你',tradition:'聖誕交換禮物',x:704/1728*100,y:459/947*100,description:'朋友、同學或同事相約交換禮物，是台灣常見的聖誕活動。有時還會加入「好禮物」與「搞怪禮物」規則，讓拆禮物成為充滿笑聲的驚喜。',note:'這是常見的現代節慶活動，並非每個人都會參加。',action:'拆開交換禮物'},
 {id:'japan',name:'日本',title:'一口紅白色的甜蜜',tradition:'草莓鮮奶油聖誕蛋糕',x:783/1728*100,y:399/947*100,description:'潔白的鮮奶油、鬆軟的海綿蛋糕與鮮紅草莓，是日本聖誕節常見的甜點風景。和珍惜的人分享一塊，也分享節日的小小幸福。',note:'聖誕蛋糕是日本常見的節慶甜點，並非每個家庭都會準備。',action:'切下一塊蛋糕'},
 {id:'newzealand',name:'紐西蘭',title:'在夏天盛開的聖誕',tradition:'Pōhutukawa 聖誕樹',x:883/1728*100,y:756/947*100,description:'紐西蘭的聖誕節正值夏天。原生的波胡圖卡瓦樹（Pōhutukawa）常在十二月綻放鮮紅花朵，因此被親切地稱為「紐西蘭聖誕樹」。',note:'實際花期會隨地區及當年的天氣有所不同。',action:'讓紅花盛開'},
 {id:'canada',name:'加拿大',title:'一封來自北極的回信',tradition:'寄信給聖誕老人',x:1120/1728*100,y:287/947*100,description:'加拿大郵政的聖誕老人回信活動，讓孩子寫下願望與祝福，等待遠方的回音。一張信紙，也能把想念與善意送到另一個人心裡。',note:'回信是節慶活動；這張明信片的回信為網站互動示意。',action:'打開聖誕老人的回信'},
 {id:'brazil',name:'巴西',title:'讓湖面接住聖誕星光',tradition:'里約的水上聖誕樹',x:1401/1728*100,y:664/947*100,description:'巴西里約熱內盧的羅德里戈—德弗雷塔斯潟湖曾多次設置水上聖誕樹。夜晚點燈時，樹上的光芒映入湖面，交織成暖亮的節慶風景。',note:'水上聖誕樹並非每年都以相同規模設置。',action:'點亮水上聖誕樹'},
];
export function cultureOutcome(id, random = Math.random) {
 if(id==='iceland') { const pick=random();return pick<.4 ? {variant:'candy',text:'鞋子裡藏著糖果！收下一點甜甜的祝福。'} : pick<.7 ? {variant:'gift',text:'是一份小禮物！小精靈把驚喜留在窗台上。'} : {variant:'potato',text:'哎呀，是一顆馬鈴薯！明天再來看看吧。'}; }
 if(id==='taiwan') return random()<.5 ? {variant:'kind',text:'是朋友準備的小熊禮物！把溫暖抱回家。'} : {variant:'funny',text:'竟然是一雙搞怪長襪！謝謝你帶來的笑聲。'};
 const result={japan:['slice','切下一塊草莓蛋糕，把甜蜜留給你。'],newzealand:['bloom','紅花盛開了！原來夏天也有自己的聖誕顏色。'],canada:['reply','親愛的朋友：願你的聖誕節充滿溫暖與歡笑。也別忘了，把善意分享給身邊的人。——聖誕老人'],brazil:['lit','燈飾亮起，湖面也接住了閃閃星光。']}[id];
 return result ? {variant:result[0],text:result[1]} : null;
}
