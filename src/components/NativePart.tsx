import React from 'react';
import parts from '../data/native-parts.json';
export default function NativePart({name}:{name:'backtest'|'market'}){
  const item=parts[name];
  return <div className={`native-part native-${name}`} data-native-component={item.component} inert aria-hidden="true">
    <div className="native-locale native-zh" dangerouslySetInnerHTML={{__html:item.zh}}/>
    <div className="native-locale native-en" dangerouslySetInnerHTML={{__html:item.en}}/>
  </div>;
}
