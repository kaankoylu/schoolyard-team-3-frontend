<script>
    import RegularButton from "./RegularButton.svelte";
    let props = $props();
</script>

<div class="max-h-[300px] bg-white shadow-md rounded-xl p-6 flex flex-col gap-4">
    <div class="flex items-center gap-12">
        <img src="/dashboard/like.png" alt="test" class="w-8 h-8"/>
        <p class="text-xl font-bold">{props.title}</p>
    </div>
    <RegularButton href={props.href} name={props.buttonName}></RegularButton>
    <p class="text-gray-600 text-sm">
    {props.description}
    </p>
</div>