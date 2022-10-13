export default function Modal({ heading, subheading, children, footer }) {
  
  return <div id="modal" class="overflow-y-auto fixed inset-0 z-30" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-full px-4 pt-4 pb-20 text-center sm:p-0">
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>
      <div class="inline-block p-5 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-2xl sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
        <div>
          <div class="my-3 text-left sm:mt-5">
            <h1 class="mb-8 text-2xl font-semibold leading-snug tracking-tighter text-neutral-600">{ heading }</h1>
            <p class="mx-auto text-base leading-relaxed text-gray-500">{ subheading }</p>
          </div>
          <div>
            {children}
          </div>
        </div>
        <div class="mt-6">
          { footer }
        </div>
      </div>
    </div>
  </div>
}