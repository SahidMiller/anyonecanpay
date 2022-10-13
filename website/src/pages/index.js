import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import StarfieldHero from "@site/src/components/StarfieldHero";
import styles from './index.module.css';
import Icon from "@site/src/components/Icons"

import IpfsIllustrationsHow1 from '@site/static/img/ipfs-illustrations-how-1.svg?inline';
import IpfsIllustrationsHow2 from '@site/static/img/ipfs-illustrations-how-2.svg?inline';
import IpfsIllustrationsHow3 from '@site/static/img/ipfs-illustrations-how-3.svg?inline';
import IpfsIllustrationsHow4 from '@site/static/img/ipfs-illustrations-how-4.svg?inline';
import IpfsIllustrationsHow5 from '@site/static/img/ipfs-illustrations-how-5.svg?inline';
import AnyonecanpayIcon from '@site/static/img/flipstarter-illustration-anyonecanpay.svg?inline';

import ProtocolLabsIcon from '@site/static/img/protocol-labs-icon.svg?inline';
import GitlabIcon from '@site/static/img/gitlab-icon.svg?inline';
import TelegramIcon from '@site/static/img/telegram-icon.svg?inline';
import MatrixIcon from '@site/static/img/matrix-icon.svg?inline';

const socialLinks = [
  {
    text: 'Gitlab',
    link: 'https://gitlab.com/ipfs-flipstarter',
    icon: GitlabIcon,
  },
  {
    text: 'Telegram',
    link: 'https://t.me/ipfs_flipstarters',
    icon: TelegramIcon
  },
  {
    text: 'Matrix',
    link: 'https://matrix.to/#/#ipfs+flipstarters:matrix.org',
    icon: MatrixIcon
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <StarfieldHero title={<div className="tracking-wide">Interplanetary Crowdfunding on <span className='font-semibold tracking-normal text-green-400'>BitcoinCash</span></div>}>
    <h2 className="text-center tracking-wide">
      An uncensorable peer-to-peer crowdfunding protocol
      <br />
      designed to grow humanity's cooperation and mutual support
      <br />
      by making fundraising easy, resilient, and more open.
    </h2>
    <div className="flex flex-col sm:flex-row mt-6">
      <Link
        type="primary"
        href="https://create.flipstarter.me"
        className="hover:bg-blueGreenLight o bg-blueGreen text-white button button--primary border-none button--lg mr-0 sm:mr-2.5 mb-2.5 sm:mb-0 px-8 py-3"
      >Get started</Link>
      <Link
        href="#how"
        className="hover:text-blueGreen hover:bg-gray-200 button text-blueGreen bg-white button--lg px-8 py-3"
        onClick={(item) => onCTAClick({ ui: 'hero/how', ...item })}
      >How it works</Link>
    </div>
  </StarfieldHero>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  console.log(IpfsIllustrationsHow1)
  debugger;
  return (
    <Layout
      title={`Interplanetary Flipstarters`}
      description="Uncensorable Crowdfunding using BitcoinCash and IPFS"
      wrapperClassName='homepage'>
      <HomepageHeader />
      <main>
        <section id="how" className="grid-margins py-20">
          <div className="text-center mb-16">
            <h2 className="font-display mb-4">How Interplanetary Flipstarter works</h2>
            <p className="text-base sm:text-lg">
              Here's what happens when you create a campaign
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div
              className="flex flex-col sm:flex-row text-center sm:text-left items-center mb-12"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 sm:mb-0">
                <Icon Asset={IpfsIllustrationsHow1} className="w-40 max-h-32" />
              </div>
              <div className="pl-0 sm:pl-10">
                <p className="leading-normal">
                  When you create a fundraiser, the form data (title, start/end,
                  content) is combined with a site template, cryptographically
                  hashed, and given a <strong> unique link </strong> with a seemingly
                  random string of characters called a <a
                    className="text-blueGreen font-bold hover:underline"
                    href={'https://proto.school/anatomy-of-a-cid'}
                  > content identifier </a> (CID). This CID acts as a permanent record to your fundraiser as
                  it exists at that point in time.
                </p>
              </div>
            </div>
            <div
              className="flex flex-col sm:flex-row text-center sm:text-left items-center mb-12"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 sm:mb-0">
                <Icon Asset={IpfsIllustrationsHow4} className="w-40 max-h-32" />
              </div>
              <div className="pl-0 sm:pl-10">
                <p className="leading-normal">
                  When other nodes <strong> look up your campaign </strong>, they ask
                  their peer nodes who's storing the content referenced by this CID.
                  When they view or download your content, they cache a copy — and
                  become another provider of your campaign until their cache is
                  cleared.
                </p>
              </div>
            </div>
            <div
              className="flex flex-col sm:flex-row text-center sm:text-left items-center mb-12"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 sm:mb-0">
                <Icon Asset={IpfsIllustrationsHow3} className="w-40 max-h-32" />

              </div>
              <div className="pl-0 sm:pl-10">
                <p className="leading-normal">
                  A node can <a
                    className="text-blueGreen font-bold hover:underline"
                    href={'https://docs.ipfs.io/concepts/persistence/'}
                  >pin your campaign</a> in order to keep (and provide) it forever. This means each node in
                  the network
                  <strong> only stores content it is interested in</strong>, plus
                  some indexing information that helps figure out which node is
                  storing what.
                </p>
              </div>
            </div>
            <div
              className="flex flex-col sm:flex-row text-center sm:text-left items-center mb-12"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 sm:mb-0">
                <Icon Asset={IpfsIllustrationsHow2} className="w-40 max-h-32" />
              </div>
              <div className="pl-0 sm:pl-10">
                <p className="leading-normal">
                  If you add a new version of your campaign to IPFS, its
                  cryptographic hash is different, and so it gets a new CID. This
                  means
                  <strong
                    > files stored on IPFS are resistant to tampering and
                    censorship </strong>
                  — any changes to fundraising data won't overwrite the original,
                  and common chunks across files can be reused in order to minimize
                  storage costs.
                </p>
              </div>
            </div>
            <div
              className="flex flex-col md:flex-row text-center md:text-left items-center mb-12"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 md:mb-0">
                <Icon Asset={IpfsIllustrationsHow5} className="w-40 max-h-32" />
              </div>
              <div className="pl-0 md:pl-10">
                <p className="leading-normal">
                  However, this doesn't mean you need to remember a long string of
                  CIDs &mdash; nodes can find the latest version of your campaign
                  using <a
                    className="text-blueGreen font-bold hover:underline"
                    href={'https://docs.ipfs.io/concepts/dnslink/'}
                  >DNSLinks</a> to map CIDs to <strong>human-readable DNS names</strong>.
                </p>
              </div>
            </div>
            <div
              className="flex flex-col md:flex-row text-center md:text-left items-center"
            >
              <div className="flex items-center justify-center max-h-36 mb-5 md:mb-0">
                <Icon Asset={AnyonecanpayIcon} className="w-40 max-h-32" />
              </div>
              <div className="pl-0 md:pl-10">
                <p className="leading-normal">
                  Unlike standard crypto payments where all inputs and all outputs
                  are signed &mdash; contributors
                  <strong> only sign for their own inputs </strong> and all outputs
                  &mdash; in other words, anyone can help pay the same outputs and
                  funds never leave the wallet until the agreed upon amount is
                  reached.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gradient-6 text-white py-8 md:py-16 mt-auto">
        <div className="grid-margins">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="flex-shrink lg:max-w-lg xl:max-w-xl mb-6 lg:mb-0">
              <h2>Stay informed</h2>
            </div>
          </div>
          <div
            className="flex flex-col lg:flex-row lg:items-top lg:justify-between pt-2"
          >
            <div className="flex items-center">
              { socialLinks.map((link, index) => <a
                  key={index}
                  className="text-white mr-5 last:mr-0"
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon Asset={link.icon} 
                    className="w-8 h-8 fill-current hover:opacity-75 transition duration-300 ease-in-out"
                    title={link.text}
                  />
                </a>) }
            </div>
          </div>
          <div className="mt-4 md:mt-8 flex items-center text-sm">
            <a
              href="https://protocol.ai"
              target="_blank"
              className="mr-2 text-white inline-block align-middle"
            >
              <Icon
                Asset={ProtocolLabsIcon}
                title="Protocol Labs"
                className="w-4 h-4 fill-current"
              />
            </a>
            <span>
              This content is modified from <a
                className="text-blueGreenLight hover:underline"
                href="https://ipfs.io"
                target="_blank"
              >ipfs.io</a> content licensed <a
                className="text-blueGreenLight hover:underline"
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
              >CC-BY 3.0</a>
            </span>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
