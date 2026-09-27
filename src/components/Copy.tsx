import React, {type ElementType, type HTMLAttributes} from 'react';
export type CopyProps = HTMLAttributes<HTMLElement> & {zh:string;en:string;as?:ElementType};
export default function Copy({zh,en,as:Tag='span',...attrs}:CopyProps){
  return <Tag {...attrs} data-i18n="" data-zh={zh} data-en={en}>{zh}</Tag>;
}
