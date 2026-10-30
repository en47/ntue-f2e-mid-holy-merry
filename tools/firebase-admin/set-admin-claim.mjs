// Trusted local/server tool only. Never import this file into a web page.
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1];};
const project=value('--project'),uid=value('--uid');
const grant=args.includes('--grant'),revoke=args.includes('--revoke'),apply=args.includes('--apply');
if(project!=='holymerry'||!uid||uid.startsWith('--')||grant===revoke){
  console.error('Usage: node tools/firebase-admin/set-admin-claim.mjs --project holymerry --uid AUTH_UID --grant|--revoke [--apply]');process.exit(1);
}
if(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST)throw Error('This production initialization tool refuses emulator environment variables');
// ADC comes from a trusted local environment or workload identity. No key is
// accepted as a command-line argument, checked into the repo or sent to the browser.
const app=initializeApp({projectId:project,credential:applicationDefault()});
try{
  const auth=getAuth(app),account=await auth.getUser(uid);
  if(grant&&(account.disabled||!account.providerData.some(p=>p.providerId==='password')))throw Error('Grant requires an enabled Email/Password account');
  const claims={...account.customClaims};if(grant)claims.admin=true;else delete claims.admin;
  console.log(`Project: ${project}\nUID: ${account.uid}\nAction: ${grant?'grant':'revoke'} admin claim\nMode: ${apply?'APPLY':'DRY RUN — no changes'}`);
  if(apply){
    await auth.setCustomUserClaims(uid,claims);
    if(revoke)await auth.revokeRefreshTokens(uid);
    const verified=await auth.getUser(uid);
    if((verified.customClaims?.admin===true)!==grant)throw Error('Claim verification failed');
    console.log('Claim verified. Sign out and sign in again to obtain a new ID token.');
  }else console.log('Review the UID and project locally. Add --apply only after verifying the intended account.');
}finally{await deleteApp(app);}
