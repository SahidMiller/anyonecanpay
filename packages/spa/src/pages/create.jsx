import { Link } from "preact-router"
import { useState, useEffect, useCallback, useRef } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { set } from 'idb-keyval';

import { useIpfs } from "../hooks/useIpfs.js";
import moment from "moment";

import FormGroup from "../components/form-group.jsx";
import FormItem from "../components/form-item.jsx";
import FormRow from "../components/form-row.jsx";
import Input from "../components/input.jsx";
import Label from "../components/label.jsx";
import ErrorMessages, { getErrorMessage } from "../components/error-messages.jsx";

import CurrencyInput from "@sahidmiller/react-currency-input-field"
import { validateURL, validateBch, validateBchAddress } from "../utils/validation.js"
import { DEFAULT_GATEWAY_URL, PRELOAD_NODES } from "../utils/constants.js"

import { useCreateFlipstarter } from "../hooks/useCreateFlipstarter.js";
import { useLoadFlipstarter } from "../hooks/useLoadFlipstarter.js";

import SimpleMDEWrapper from "../components/simplemde-wrapper.jsx";
import { SATS_PER_BCH } from "../utils/bitcoinCashUtilities.js";
import Landing from "../pages/landing.jsx";
import prettyPrintSats from "../utils/prettyPrintSats.js";
import { v4 as uuidv4 } from 'uuid';

const emptyRecipient = { name: "", bch: "", address: "" };
const emptyPreloadNode = { url: "", multiaddr: "" }
const today = new Date();
const todayFormatted = today.toISOString().split("T")[0];

import "../../public/css/campaign.css";

const errorMessages = {
  title: {
    required: 'Fundraiser requires a title.'
  },
  image: {
    validate: "Invalid url."
  },
  description: { 
    required: "Fundraiser requires a description."
  },
  expires: {
    required: "Fundraiser requires an expiration date.",
  },
  recipient: {
    name: { 
      required: 'Name is required.',
    },
    bch: { 
      required: 'Amount is required.',
      validate: "Minimum amount is 546 SATS"
    },
    address: { 
      required: 'Address is required.',
      validate: "Invalid BCH address."
    }
  }
}

const emptyDraft = {
  title: "",
  expires: "",
  image: "",
  description: "",
  defaultGatewayUrl: DEFAULT_GATEWAY_URL,
  recipients: [emptyRecipient],
  preloadNodes: PRELOAD_NODES
};

const logError = (err) => {
  console.log("Error publishing.", err);
}

import { saveCampaignResult } from "../hooks/useLoadFlipstarter.js";

export default function CreatePage({ id = "draft", setIsLoading, isLoading }) {
  const { ipfs, ipfsError } = useIpfs();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ready, setReady] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [readOnly, setReadOnly] = useState(id !== "draft");

  useEffect(() => {
    if (id !== "draft") {
      setReadOnly(true);
    }
  }, [id]);

  const { 
    control, 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isValid, isDirty }, 
    setValue,
    getValues,
    reset
  } = useForm({ 
    mode: "onBlur", 
    reValidateMode: 'onChange',
  });

  const description = useWatch({ name: 'description', control });
  const descriptionProps = register("description", { required: true });
  const { onBlur:onDefaultGatewayBlur, ...defaultGatewayProps } = register(`defaultGatewayUrl`, { required: true, validate: validateURL  });

  const { fields:recipients, append:addRecipient, remove:removeRecipient, update:updateRecipient} = useFieldArray({
    control,
    name: "recipients", // unique name for your Field Array
  });
  
  const { fields:preloadNodes, append:addPreloadNode, remove:removePreloadNode, update:updatePreloadNode} = useFieldArray({
    control,
    name: "preloadNodes", // unique name for your Field Array
  });
  
  const createFlipstarter = useCreateFlipstarter({
    onSuccess: async (result) => {
      if (!readOnly || isDirty) {
        const campaignData = await saveCampaignResult(result);
        if (campaignData) {
          setCampaignData(campaignData);
          setReadOnly(true);
        }
      }
    },
    onError: logError
  });
  
  const isSuccess = createFlipstarter.isSuccess;
  const isPublishing = createFlipstarter.isLoading;
  const hasPublishingError = createFlipstarter.isError;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isSuccess) {
        createFlipstarter.reset()
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isSuccess, createFlipstarter]);

  const checkKeyDown = (e) => {
    //Prevent form submit on Enter
    const keyCode = e.keyCode ? e.keyCode : e.which; 
    if (keyCode === 13) e.preventDefault();
  }
  
  //Load a draft
  useLoadFlipstarter(id, {
    onFetch: () => {
      setIsLoading(true);
    },
    onSuccess: (campaignData) => {
      if (id === 'draft') {       
        setCampaignData(null);
        reset(campaignData || emptyDraft);
      } else {

        setCampaignData(campaignData);
        reset(campaignData);
      }
    },
    onError: (err) => {
      console.log(err);
      reset(emptyDraft);
    },
    onSettled: () => {
      setReady(true);
    }
  });

  useEffect(() => {
    if (!ready) return;
    
    //Load for a little longer, and backoff if unmounted;
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ready]);

  useEffect(() => {
    
    let timeout;
    const subscription = watch((data, { type, name }) => {
           
      if (id === "draft") {
        //Only run once in 1s
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          await set("draft", data);
        }, 500);
      }
    });

    return () => { subscription.unsubscribe(); }
  }, [id]);

  const _onDefaultGatewayBlur = useCallback((e) => {
    if (!e.target.value) e.target.value = "https://dweb.link";
    return onDefaultGatewayBlur(e);
  }, []);
  
  const onDescriptionChange = useCallback((val) => {
    setValue('description', val, { shouldValidate: true, shouldTouch: true })
  }, []);

  const [showPreview, setShowPreview] = useState(false);
  const scrollHeight = useRef(0);
  
  useEffect(async () => {
    if (showPreview) {
      document.body.style.overflowY = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = -scrollHeight.current + 'px';
      window.scrollTo(0, 0);
    } else {
      document.body.style.position = ''
      document.body.style.overflowY = 'auto'
      document.body.style.top = 0;
      window.scrollTo(0, scrollHeight.current);
    }
  }, [showPreview]);

  const onPreviewToggle = useCallback(() => {

    return setShowPreview((showPreview) => {
      if (showPreview) {
        return false;
      }
      
      scrollHeight.current = window.pageYOffset;

      const campaignData = getValues();
      
      const campaign = {
        title: campaignData.title,
        image: campaignData.image,
        description: campaignData.description,
        recipients: campaignData.recipients.map((recipient) => {
          const bch = parseFloat(recipient.bch);
          const sats = Math.round(bch * SATS_PER_BCH);
  
          return {
            name: recipient.name,
            address: recipient.address,
            satoshis: sats,
          }
        })
      }
  
      if (campaignData.expires) {
        campaign.expires = Math.floor(new Date(campaignData.expires + "T23:59:59.999Z").getTime() / 1000)
      }

      return campaign;
    });
  }, [getValues, setShowPreview]);

  const history = campaignData?.history || [];

  const submitButtonText = isPublishing ? "Loading..." : 
    isSuccess ? "Success!" : 
    hasPublishingError ? "There was a problem. Try again?" :
    campaignData ? 
      readOnly ? "Republish" : "Republish edits" : 
      "Create";

  return <div id="main">
    <div>
      <button class="fixed rounded-full bg-blue-600 z-40 text-sm text-white bottom-4 right-4 w-[60px] h-[60px] sm:bottom-8 sm:right-8 sm:w-[80px] sm:h-[80px] sm:text-lg" onClick={onPreviewToggle}>{ showPreview ? "Editor" : "Preview" }</button>
      {
        showPreview && <div class="clouds fixed w-screen h-screen z-30 inset-0 overflow-y-auto" style="inset:0;">
          <div class="static">
            <Landing campaign={showPreview} isDraft={true}></Landing>
          </div>
        </div>
      }
      <form onSubmit={handleSubmit((data) => {
        createFlipstarter.reset();
        createFlipstarter.mutate(data);
      })} onKeyDown={(e) => checkKeyDown(e)} noValidate>
        <div class="text-center">
          <h2 id="create-title" class="text-3xl mt-3 mb-5">Create a campaign</h2>
        </div>
        {/* <!-- Title --> */}
        <FormGroup className="mt-6">
          <p className="text-2xl mb-2" ><label for="title">Title</label></p>
          <Input readonly={readOnly} type="text" error={errors.title} id="title" { ...register("title", { required: true }) }/>
          <ErrorMessages error={errors.title} messages={errorMessages.title}></ErrorMessages>
        </FormGroup>
        
        {/* <!-- Hero image/url --> */}
        <FormGroup className="mt-6">
          <p className="text-2xl mb-2" ><label for="image">Hero</label> <small class="text-xs">(url to image)</small></p>
          <Input type="text" readonly={readOnly} error={errors.image} id="image" { ...register("image", { validate: validateURL }) }/>
          <ErrorMessages error={errors.image} messages={errorMessages.image}></ErrorMessages>
        </FormGroup>

        {/* <!-- Markdown files --> */}
        <FormGroup className="mt-6">
        <p class="text-2xl mb-2" ><label for="description">Description</label></p>
          <p>Provide your potential investors with in-depth information about your project. <a class="text-nowrap text-blue-500" data-toggle="modal" data-target="#modal-abstract-demo" href="#"><u>Learn more</u></a>
          </p>
          <div class="row mt-4">
            <div id="markdownEditors" class="col tab-content">
              <div class="tab-pane fade show active" id="english" role="tabpanel" aria-labelledby="english-tab">
                <div className={`${errors.description ? 'border border-red-500 rounded-lg' : ''}`}>
                  { ready && <SimpleMDEWrapper
                      readonly={readOnly}
                      id="description" 
                      rows="4"
                      initialValue={campaignData?.description || description}
                      {...descriptionProps} 
                      onChange={onDescriptionChange}>
                    </SimpleMDEWrapper> }
                </div>
                <ErrorMessages error={errors.description} messages={errorMessages.description}></ErrorMessages>
              </div>
            </div>
          </div>
        </FormGroup>

        {/* <!-- Expires --> */}
        <FormGroup className="mb-8">
          <p className="text-2xl mb-2" ><label for="expires">End date</label>{/* <small class="text-xs">(UTC±00:00)</small> */}</p>
          <Input id="expires" type="date" readonly={readOnly} min={todayFormatted} error={errors.expires} { ...register("expires") }/>
          <ErrorMessages error={errors.expires} messages={errorMessages.expires}></ErrorMessages>
        </FormGroup>

        {/* <!-- Recipients --> */}
        <FormGroup>
          <div id="recipients">
            <p class="text-2xl mb-2 pb-2 border-b">Recipients</p>
            { recipients.map((recipient, index) => {
              const recipientErrors = errors?.recipients?.[index] || {};
              const nameLabel = `recipient_name[${index}]`
              const amountLabel = `amount[${index}]`
              const bchLabel = `bch_address[${index}]`

              return <div class="recipient mt-4" key={recipient.id}>
                <div class="flex justify-between">
                  <p class="mb-2">Recipient {index + 1}</p>
                  <div class="text-red-500 cursor-pointer" onClick={() => recipients.length === 1 ? updateRecipient(index, emptyRecipient) : removeRecipient(index)}>{ recipients.length === 1 ? "Clear" : "Remove" }</div>
                </div>
                <FormRow className="text-muted">
                  <FormItem className="col-lg-3" error={getErrorMessage(recipientErrors.name, errorMessages.recipient.name)}>
                    <Label for={nameLabel}>Name</Label>
                    <Input  id={nameLabel} readonly={readOnly} type="text" error={recipientErrors.name} { ...register(`recipients.${index}.name`, { required: true }) } />
                  </FormItem>
                  <FormItem className="col-lg-3" error={getErrorMessage(recipientErrors.bch, errorMessages.recipient.bch)}>
                    <Label for={amountLabel}>Funding Goal <small>(BCH)</small></Label>
                    <Input id={amountLabel} readonly={readOnly} Component={CurrencyInput} error={recipientErrors.bch} value={getValues(`recipients.${index}.bch`)} inputmode="decimal" autocomplete="off" decimalScale={8} decimalsLimit={8} { ...register(`recipients.${index}.bch`, { required: true, validate: validateBch }) } onValueChange={(val) => setValue(`recipients.${index}.bch`, val, { shouldValidate: true, shouldTouch: true })}/>
                  </FormItem>
                  <FormItem className="col-lg-6" error={getErrorMessage(recipientErrors.address, errorMessages.recipient.address)}>
                    <Label for={bchLabel}>Bitcoin Cash Address</Label>
                    <Input id={bchLabel} readonly={readOnly} type="text" error={recipientErrors.address} { ...register(`recipients.${index}.address`, { required: true, validate: validateBchAddress }) } />
                  </FormItem>
                </FormRow>
              </div>
            }) }
          </div>
          <button id="add-recipient" class="text-blue-500 cursor-pointer" type="button" onClick={(e) => { e.preventDefault(); addRecipient(emptyRecipient)}}>Add a recipient</button>
        </FormGroup>
        
        {/* <!-- History --> */}
        { !!history.length && <FormGroup className="mt-8">
          <div id="recipients">
            <p class="text-2xl mb-2 pb-2 border-b">History</p>
            { history.map((item, index) => {
              return <div class="history-item mt-4" key={item.id}>
                <FormRow justify={"none"}>
                  <div>
                    <div className="text-gray-600">{moment.unix(item.created).fromNow()}:</div>
                  </div>
                  <div className="overflow-hidden text-ellipsis w-full">
                    <Link class="font-semibold text-green-500 underline" href={`/manage/${item.id}`}>{item.id}</Link>
                  </div>
                </FormRow>
              </div>
            }) }
          </div>
        </FormGroup> }

        <FormGroup className="mt-6 border-t">

          <FormGroup className={`mt-6 ${!showAdvanced && "hidden"}`}>
            <p class="text-2xl mb-2">Advanced configuration</p>
            <p>Connect your campaign to the decentralized web. <a class="text-blue-500 text-nowrap" data-toggle="modal" data-target="#modal-abstract-demo" href="#"><u>Learn more</u></a>
            </p>
            {/* <!-- Set default gateway to show url --> */}
            
            <p class="mb-2 mt-4"><label for="default_gateway_url">Default IPFS Gateway</label></p>
            <FormRow className="mb-6">
              <FormItem>
                <Input type="text" class="form-control" id="default_gateway_url" { ...defaultGatewayProps } onBlur={_onDefaultGatewayBlur} defaultValue="https://dweb.link"/>
              </FormItem>
            </FormRow>

            <div class="mt-6">
              <div id="preload-nodes">
                <div class="preload-node">
                  <p class="mb-1">Preload Nodes</p>
                    <div class="my-2 text-sm">
                      { preloadNodes.map((preloadNode, index) => { 
                        const preloadNodeErrors = errors?.preloadNodes?.[index] || {}

                        const preloadFailed = campaignData && campaignData.successfulPreloadNodeIndexes.indexOf(index) === -1;
                        const preloadSucceeded = campaignData && !preloadFailed

                        return <div key={preloadNode.id}>
                          <div class="flex justify-between sm:block">
                            <p class="my-4">Preload Node {index + 1}</p>
                            <div class="block sm:hidden text-red-500 cursor-pointer" onClick={() => preloadNodes.length === 1 ? updatePreloadNode(index, emptyPreloadNode) : removePreloadNode(index)}>Remove</div>
                          </div>
                          <FormRow gap={1}>
                            <FormItem error={preloadFailed && "Failed to upload"} success={preloadSucceeded && "Upload success"}>
                              <Label for="preload_node[${index}]">URL</Label>
                              <Input type="text" error={preloadNodeErrors.url} class="form-control check-url" id={`preload_url[${index}]`} { ...register(`preloadNodes.${index}.url`, { required: true, validate: validateURL  }) } />
                            </FormItem>
                            <FormItem class="form-group col-lg-6">
                              <Label for="preload_multiaddr[${index}]">Multiaddress</Label>
                              <Input type="text" class="form-control check-multiaddrs" id={`preload_multiaddr[${index}]`} { ...register(`preloadNodes.${index}.multiaddr`) }/>
                            </FormItem>
                            <div class="hidden sm:block text-red-500 cursor-pointer m-auto translate-y-1/2" onClick={() => preloadNodes.length === 1 ? updatePreloadNode(index, emptyPreloadNode) : removePreloadNode(index)}>{ preloadNodes.length === 1 ? "Clear" : "Remove" }</div>
                          </FormRow>
                          { preloadNodeErrors.url && preloadNodeErrors.url.type === 'required' ? <span class="text-red-500 text-sm">Preload URL is required</span> : <></>}
                          { preloadNodeErrors.url && preloadNodeErrors.url.type !== 'required' ? <span class="text-red-500 text-sm">Invalid URL format.</span> : <></>}
                        </div>
                      }) }
                      <button id="add-preload-node" class="mt-2 text-blue-500 cursor-pointer" type="button" onClick={() => addPreloadNode({ multiaddr: "", url: "" })}>Add a node</button>
                    </div>
                </div>
              </div>
            </div>
          </FormGroup>
                    
          <FormGroup className="mt-6">

            {/* <!-- Error message --> */}
            <p class="text-red-500 hidden" id="error">Some fields are incorrect.</p>

            <div class="flex flex-wrap justify-between items-center gap-4">
            
              {/* <!-- Submit button --> */}
              <button type="submit" id="create" class="text-white px-8 py-4 rounded bg-green-600 hover:bg-green-700 tracking-wide font-semibold shadow-lg disabled:bg-gray-300">{submitButtonText}</button>
              { campaignData && <button type="button" id="edit" class="text-white px-8 py-4 rounded bg-blue-500 hover:bg-blue-600 tracking-wide font-semibold shadow-lg disabled:bg-gray-300" onClick={() => setReadOnly((v) => !v)}>{ readOnly ? "Edit" : "Cancel" }</button> }
              <div id="advanced-config-link-container" class="flex-grow text-right">
                <a class="text-blue-500" href="#" onClick={(e) => { e.preventDefault(); setShowAdvanced(!showAdvanced) }}>{!showAdvanced ? "Show" : "Hide"} advanced configuration</a>
              </div>
            </div>
            
            <div className="mt-6">
              <p id="result" class={`cursor-pointer overflow-hidden overflow-ellipsis text-sm text-center text-green-400 ${!campaignData?.hash ? "hidden" : ""}`}>
                <a class="font-semibold text-green-500 underline" href={campaignData?.url} target="_blank">{campaignData?.url}</a>
                <br />
                Share or <a class="underline" href={campaignData?.download} download={`${campaignData?.hash}.car`}>download</a> this hash to keep it accessible on the web.
              </p>
            </div>

            <br/>
          </FormGroup>
        </FormGroup>
      </form>
    </div>
  </div>
}