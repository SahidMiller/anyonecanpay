const UploadFileInput = styled.input.attrs({
  type: "file"
})`
  appearance: none;

  &::-webkit-file-upload-button{
    background:#1f2937;
    border:0;
    color:#fff;
    cursor:pointer;
    font-size:.875rem;
    font-weight:500;
    height: 100%
  }

  &::-webkit-file-upload-button:hover {
    background:#374151;
  }

  .dark &::-webkit-file-upload-button {
    background:#4b5563;
    color:#fff;
  }

  .dark &::-webkit-file-upload-button:hover {
    background:#6b7280
  }
`

export default UploadFileInput;