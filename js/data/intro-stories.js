const asset = name => `assets/illustrations/intro/${name}.png`;
// Percent coordinates share one stage; architecture feet use the same 18% datum.
const piece = (id, file, alt, x, y, w, h, z, depth, delay) => ({ id, src: asset(file), alt, x, y, w, h, z, depth, delay });
export const introStories = [
  { title: '耶穌的誕生', chapter: '第一章', subtitle: '在伯利恆誕生的希望',
    story: "因客店已無空房，約瑟與瑪利亞只能在簡陋的牲口棚中落腳。耶穌並非誕生於華麗的宮殿，而是裹著布，安靜地躺在卑微的馬槽裡。這份平凡的誕生，象徵著平安與救贖不分身分貴賤，也能走進最困苦的人心中。\n\n那一夜，伯利恆之星在黑暗的夜空中閃耀，指引野地裡的牧羊人前來探望。依照聖經的記載，東方博士也循著星光，帶著珍貴的禮物前來朝拜。\n\n從此，星光象徵著黑暗中的希望，而獻上禮物的心意，也成為人們理解聖誕節愛與祝福的方式之一。", quote: '即使是微小的星光，也能指引希望。',
    scene: '伯利恆村莊在馬廄左後方；瑪利亞在左、嬰孩在中、約瑟在右，動物依偎在前景。',
    pieces: [piece('bethlehem','bethlehem','左後方的伯利恆村莊',0,18,54,47,1,-22,0),piece('star','star','劃過夜空的伯利恆之星',61,76,29,19,2,-8,80),piece('stable','stable','共用地面的中央馬廄',30,18,63,57,3,5,160),piece('mary','mary','左側的瑪利亞',10,8,25,41,6,13,300),piece('joseph','joseph','右側的約瑟',72,8,24,41,6,14,350),piece('manger','manger','中間安睡在馬槽的嬰孩',37,7,30,28,7,19,410),piece('sheep','sheep','前景的小羊',2,2,24,20,8,23,460),piece('cow','cow_donkey','前景依偎的牛和驢',71,2,28,22,8,24,510)] },
  { title: '聖尼古拉', chapter: '第二章', subtitle: '藏在長襪裡的善意',
    story: "相傳，在寒冷的古代冬季村莊裡，有位貧困的父親無力為三個女兒準備嫁妝，全家因此陷入困境。\n\n仁慈的聖尼古拉得知後，決定悄悄幫助他們。他趁著深夜，將裝滿金幣的袋子送進屋內。傳說其中的金幣恰巧落入壁爐旁晾曬的長襪中，讓一家人意外收到了珍貴的禮物。\n\n這份不求回報的善舉，不僅帶給一家人溫暖，也讓「秘密贈禮、分享與慷慨」逐漸成為聖誕節的重要精神。聖尼古拉的故事，更成為後來聖誕老人傳說的靈感來源。", quote: '真心的禮物，不求任何回報。',
    scene: '教堂村莊在積雪小屋右後方；聖尼古拉、家庭與壁爐圍成一個溫暖的雪地場景。',
    pieces: [piece('village','village','右後方的教堂村莊',55,18,44,48,1,-23,0),piece('night','night','月亮與星空',65,78,29,16,2,-10,80),piece('cottage','cottage','左側的積雪小屋',8,18,65,58,3,5,160),piece('nicholas','nicholas','送來禮物的聖尼古拉',2,3,25,47,7,17,300),piece('family','family','父親與三個女兒',29,3,43,31,8,23,370),piece('fireplace','fireplace','家庭右側掛著長襪的壁爐',76,3,23,35,7,19,440)] },
  { title: '今日的聖誕節', chapter: '第三章', subtitle: '讓希望與善意延續',
    story: "千年前的希望星光與溫暖善行，隨著時間流轉，逐漸融入今日世界各地的聖誕文化。\n\n人們在聖誕樹頂端掛上閃耀的星星，令人想起當年照亮伯利恆的星光；在壁爐或床邊掛起長襪、互相贈送禮物，延續聖尼古拉悄悄幫助他人的善意。\n\n當燈飾點亮冬夜的街道，家人與朋友相聚，聖誕節也成為跨越文化、分享祝福的節日。無論人們以什麼方式慶祝，那份關於希望、關懷與愛的心意，仍在每一次歡笑與相聚中延續。", quote: '分享的時候，聖誕的溫暖就會延續。',
    scene: '積雪小屋與聖誕樹並肩，路燈、禮物與雪坡在前景層層展開，沒有另加遠景房屋。',
    pieces: [piece('moon','today_moon','月亮與星空',5,78,37,16,1,-18,0),piece('house','today_house','聖誕小屋',17,18,59,57,3,5,160),piece('pine','today_pine','小屋左邊的積雪松樹',8,18,18,41,4,6,210),piece('lamp','today_lamp','左前方的暖光路燈',4,8,10,44,5,11,260),piece('tree','today_tree','右側掛滿裝飾的聖誕樹',70,8,29,70,6,15,310),piece('sign','today_sign','前景的木路牌',19,8,13,34,6,14,350),piece('fence','today_fence','小屋前方的木圍籬',34,7,33,20,7,19,400),piece('snowlong','today_snow_long','左側前景雪坡',1,1,65,14,8,22,450),piece('snowshort','today_snow_short','右側前景雪坡',59,1,39,12,8,23,470),piece('gifts','today_gifts','樹下的聖誕禮物',59,4,29,18,9,26,500),piece('stockred','today_stock_red','紅色聖誕襪',43,8,7,14,9,27,540),piece('stockgreen','today_stock_green','綠色聖誕襪',51,8,7,14,9,27,570),piece('sack','today_gift_sack','右側的紅色禮物袋',88,2,10,18,10,28,600)] },
];
