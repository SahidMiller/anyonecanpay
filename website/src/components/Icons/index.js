import React from 'react';

const DefaultAsset = () => <></>
export default function Icon({ Asset = DefaultAsset, className="" }) {
  return <Asset className={"icon " + className}></Asset>
}