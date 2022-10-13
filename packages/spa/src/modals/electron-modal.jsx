import { useState, useCallback, useMemo } from "react";
import useExternalBip21Url from "../hooks/useExternalBip21Url.js";
import { useRefreshContributionQueries } from "../hooks/useContributionQueries.js";

import { route } from "preact-router";
import { ElectronCommitmentForm } from "../components/electron-commitment-form.jsx";
import { ElectronSignatureForm } from "../components/electron-signature-form.jsx";
import { ElectronCommentForm } from "../components/electron-comment-form.jsx";
import { ElectronNotificationUrl } from "../components/electron-notification-url.jsx";
import PrimaryButton from "../components/inputs/primary-button.jsx";
import SecondaryButton from "../components/inputs/secondary-button.jsx";
import Modal from "../components/modal.jsx";

import { encode as cborgencode } from "cborg";
import { verifyContributionData } from "@ipfs-flipstarter/utils/common";

export default function ElectronModal({ donationAmount, onClose:userOnClose }) {
  const [step, setStep] = useState(0);
  const [heading, setHeading] = useState();
  const [subheading, setSubheading] = useState();
  const [primaryButton, setPrimaryButton] = useState();
  const [secondaryButton, setSecondaryButton] = useState();
  const [disablePrimaryButton, setDisablePrimaryButton] = useState(true);
  const [electronCommitment, setElectronCommitment] = useState();
  const [alias, setAlias] = useState(false);
  const [comment, setComment] = useState(false);
  const [dataSignature, setDataSignature] = useState(null);
  const [showSignatureError, setShowSignatureError] = useState(false);

  const address = electronCommitment && electronCommitment.address;  
  const dataMessage = useMemo(() => {
    return Buffer.from(cborgencode(JSON.stringify({ comment, alias }))).toString("base64");
  }, [comment, alias]);
  const createExternalBip21Url = useExternalBip21Url(electronCommitment, comment, alias, dataSignature);
  const refreshContributions = useRefreshContributionQueries();

  const onClose = useCallback(async () => {
    if (step === steps.length - 1) {
      await refreshContributions();
      setTimeout(() => route('/'), 2000);
    }
    
    userOnClose?.();
  }, [step, userOnClose])

  const onSignedMessageChanged = useCallback(async (e) => {
    setDataSignature(null);

    const value = e.target.value;
    let verified = false;

    try {
      // debugger;

      verified = verifyContributionData(electronCommitment.address, {
        applicationData: { comment, alias },
        applicationDataSignature: value
      });

    } catch (err) {
    }
    
    setDisablePrimaryButton(!verified);
    setShowSignatureError(!verified);
    
    if (verified) setDataSignature(value);

  }, [comment, alias, address]);

  const steps = [{ 
    Component: ElectronCommitmentForm,
    props: { donationAmount, setElectronCommitment }
  }, { 
    Component: ElectronCommentForm,
    props: { comment, alias, setAlias, setComment }
  }, { 
    Component: ElectronSignatureForm,
    props: { dataMessage, address, dataSignature, showSignatureError, onSignedMessageChanged }
  }, { 
    Component: ElectronNotificationUrl,
    props: { bip21Uri: createExternalBip21Url.data },
    beforeRender: createExternalBip21Url.mutate,
    readyShow: createExternalBip21Url.isSuccess
  }]
  
  const StepComponent = steps.length > step ? steps[step] : null;
  const nextStep = steps[step + 1];

  const onNextStep = useCallback(async () => {
    if (disablePrimaryButton) return;

    if (nextStep.beforeRender) {
      try {
        await nextStep.beforeRender();
      } catch (err) {
        //Show error for next step independently of it.
        console.log(err);
      }
    }

    setHeading(null);
    setSubheading(null)
    setPrimaryButton(null);
    setSecondaryButton(null);
    setDisablePrimaryButton(true);

    setStep(step + 1)
  }, [disablePrimaryButton, step])

  const footer = step === steps.length - 1 ? <div class="flex justify-end">
    <SecondaryButton onClick={onClose}>Done</SecondaryButton>
  </div> : <div class="flex justify-between">
    <PrimaryButton disabled={disablePrimaryButton} onClick={onNextStep}>{ primaryButton || "Next" }</PrimaryButton>
    <SecondaryButton onClick={onClose}>{ secondaryButton || "Cancel" }</SecondaryButton>
  </div>

  return <Modal heading={heading || <></>} subheading={subheading || <></>} footer={footer}>
    <StepComponent.Component
      setHeading={setHeading} 
      setSubheading={setSubheading} 
      setPrimaryButton={setPrimaryButton} 
      setDisablePrimaryButton={setDisablePrimaryButton} 
      setSecondaryButton={setSecondaryButton}
      { ...StepComponent.props }
    />
  </Modal>
}