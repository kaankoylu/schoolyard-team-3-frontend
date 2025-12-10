<script>    
    let classes = ["Groep A", "Groep B", "Groep C"];
    let selectedClass = "";
    let generatedCode = "";


    function generateCode() {
    if (!selectedClass) return;
    generatedCode = Math.random().toString().substring(2, 8);
    const codeWindow = window.open("", "_blank");//"width=400,height=300"
    if (!codeWindow) {
        alert("Popup blocked! Please allow popups for this site.");
        return;
    }
    codeWindow.document.write(`
        <html>
            <head><title>Class Code</title></head>
            <body style="font-family: sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
                <div>
                    <h2>Class: ${selectedClass}</h2>
                    <h1>Code: ${generatedCode}</h1>
                </div>
            </body>
    </html>
    `);
    }
</script>
<div class="bg-white shadow-md rounded-xl p-6 flex flex-col gap-4 w-full flex-1">
            <h2 class="text-xl font-semibold">Generate Class Code</h2>
            <select bind:value={selectedClass} class="px-4 py-2 rounded-lg border w-full">
            <option value="">Select a class...</option>
            {#each classes as cls}
            <option value={cls}>{cls}</option>
            {/each}
            </select>

            <button class="px-4 py-2 rounded-lg bg-green-600 text-white cursor-pointer hover:bg-green-700 w-full" on:click={generateCode}>
            Generate Code
            </button>

            {#if generatedCode}
            <p class="text-gray-600">Last generated code: <strong>{generatedCode}</strong></p>
            {/if}
</div>