// V8's painted-map coordinates, not a longitude/latitude projection.
export const introCultures = [
 {id:'iceland',name:'冰島',title:'窗台上的 13 位小精靈',x:132/1728*100,y:276/947*100,description:'聖誕節前的 13 個夜晚，小精靈輪流來訪，在孩子的鞋裡留下禮物，調皮的話就只有馬鈴薯。',action:'放好鞋子，等下一位'},
 {id:'uk',name:'英國',title:'砰！拉開聖誕拉炮',x:192/1728*100,y:304/947*100,description:'英國的聖誕餐桌上，兩個人各拉住拉炮的一端，「砰」一聲裂開，裡面有紙皇冠、小玩具和一則冷笑話。',action:'用力拉拉炮'},
 {id:'finland',name:'芬蘭',title:'跨過北極圈的那條線',x:305/1728*100,y:245/947*100,description:'羅瓦涅米的聖誕老人村就在北極圈上，地上畫著一條白線，一步就能跨進北極圈；聖誕老人一年到頭都在這裡等大家來訪。',action:'往前走一步',link:{href:'santa.html',text:'去拜訪聖誕老人 →'}},
 {id:'taiwan',name:'台灣',title:'交換禮物大抽獎',x:704/1728*100,y:459/947*100,description:'朋友相約交換禮物，好禮和搞怪禮都有，拆開前誰也不知道。點一個禮物盒試試手氣。',action:'隨便拆一個'},
 {id:'japan',name:'日本',title:'一起分聖誕蛋糕',x:783/1728*100,y:399/947*100,description:'草莓鮮奶油蛋糕是日本聖誕節最常見的甜點，紅白配色看起來就很喜氣。',action:'切一塊蛋糕'},
 {id:'newzealand',name:'紐西蘭',title:'夏天開花的聖誕樹',x:883/1728*100,y:756/947*100,description:'這裡的聖誕節在夏天。波胡圖卡瓦樹常在十二月開滿紅花，被稱為紐西蘭聖誕樹。',action:'讓紅花再開一點'},
 {id:'canada',name:'加拿大',title:'寄信給聖誕老人',x:1120/1728*100,y:287/947*100,description:'加拿大郵政的聖誕老人信箱有個專屬郵遞區號 H0H 0H0，寫信過去有機會收到回信。',action:'投遞信件'},
 {id:'brazil',name:'巴西',title:'湖面上的聖誕樹',x:1401/1728*100,y:664/947*100,description:'里約的羅德里戈—德弗雷塔斯潟湖曾多次設置水上聖誕樹，燈光映在湖面上閃閃發亮。',action:'換一種燈光'},
 {id:'mexico',name:'墨西哥',title:'敲破星星彩罐',x:1200/1728*100,y:448/947*100,description:'墨西哥從 12/16 起連續九個晚上慶祝 Las Posadas，最後大家蒙上眼睛，輪流敲打星星彩罐，糖果和水果撒滿一地。',action:'敲一下彩罐'},
];
// Everyone who visits on the 13 nights before Christmas, by the mischief in their names.
export const yuleLads = ['羊圈搗蛋鬼','山溝小鬼','矮冬瓜','舔湯勺','刮鍋底','舔碗小鬼','甩門鬼','偷優格','偷香腸','窗邊偷看鬼','門縫聞香鬼','肉鉤子','偷蠟燭'];
const shoeGifts = [['candy','一袋糖果'],['chocolate','一片巧克力'],['mittens','一雙小手套'],['horse','木頭小馬'],['book','一本新書'],['potato','一顆馬鈴薯，哎呀！']];
const gifts = [['bear','小熊玩偶'],['tea','一杯珍珠奶茶'],['cake','一盒鳳梨酥'],['mug','聖誕馬克杯'],['scarf','手織圍巾'],['lantern','暖暖小夜燈'],['sock','搞怪長襪'],['yam','一條烤地瓜'],['ticket','再抽一次券']];
const slices = ['給辛苦的媽媽','給最好的朋友','給剛下班的爸爸','給隔壁的小孩','留給聖誕老人','最後一塊是你的'];
const replies = ['親愛的朋友：願你的聖誕節充滿歡笑。','信收到了！麋鹿說謝謝你的胡蘿蔔。','今年的你很棒，明年也要好好的。','你的願望已放進雪橇，請耐心等候。','北極很冷，但你的信很溫暖。'];
const lights = [['gold','點亮金色星光。'],['holly','換上紅綠聖誕燈。'],['ocean','湖面變成海洋藍。'],['samba','森巴彩虹，放煙火！']];
const crowns = [['red','紅色'],['green','綠色'],['gold','金色']];
const jokes = ['雪人為什麼不怕考試？因為它很冷靜。','聖誕老人為什麼總是笑呵呵？因為他有很多「禮」由。','麋鹿的雪橇為什麼從不迷路？因為牠們走「鹿」線。','雪花為什麼每一片都不一樣？因為它們不想撞衫。'];
const circle = ['走到北極圈的白線前面。','一步跨進北極圈！','聖誕老人在門口揮手：「歡迎來北極圈！」'];
const hits = ['第 1 下，彩罐晃了一下。','第 2 下，裂開一條縫！','破了！糖果和水果撒滿一地。'];
export const cultureSteps={iceland:13,japan:6,newzealand:7,brazil:4,finland:3,uk:2,mexico:3};
const pick=(list,random)=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
// `step` counts how many times this postcard has played, so the story moves forward.
export function cultureOutcome(id, random = Math.random, step = 0) {
 const at=step%(cultureSteps[id]??1);
 if(id==='iceland'){const [variant,gift]=pick(shoeGifts,random);return {variant,step:at,text:`第 ${at+1} 夜．${yuleLads[at]}留下了${gift}`};}
 if(id==='taiwan'){const [variant,gift]=pick(gifts,random);return {variant,text:`你抽到${gift}${variant==='ticket'?'，再點一次吧！':'！'}`};}
 if(id==='japan')return {variant:`slice-${at}`,step:at,text:`第 ${at+1} 塊，${slices[at]}。`};
 if(id==='newzealand')return {variant:`bloom-${at}`,step:at,text:at===6?'開滿了！紅色花瓣落在夏天的沙灘上。':`第 ${at+1} 叢紅花開了。`};
 if(id==='canada')return {variant:'reply',text:`回信：${pick(replies,random)}`};
 if(id==='brazil'){const [variant,name]=lights[at];return {variant,step:at,text:name};}
 if(id==='finland')return {variant:`step-${at}`,step:at,text:circle[at]};
 if(id==='uk'){if(!at)return {variant:'tug',step:0,text:'兩個人各拉一端，用力……'};const [variant,colour]=pick(crowns,random);return {variant,step:1,text:`砰！戴上${colour}紙皇冠，冷笑話：${pick(jokes,random)}`};}
 if(id==='mexico')return {variant:`hit-${at}`,step:at,text:hits[at]};
 return null;
}
