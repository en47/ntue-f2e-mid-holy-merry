export function selectTreeWishes(latest, published, uid) {
  if(latest && latest.ownerUid!==uid)throw new Error('Latest wish must belong to visitor');
  const own=latest?{...latest,isOwn:true}:null,unique=new Map();
  for(const wish of published){
    if(wish.ownerUid===uid || unique.has(wish.id))continue;
    unique.set(wish.id,{...wish,isOwn:false});
  }
  const others=[...unique.values()].slice(0,own?9:10);
  return own?[own,...others]:others;
}
