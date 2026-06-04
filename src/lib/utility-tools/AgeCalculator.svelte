<script context="module">
	export const title = 'Age Calculator';
	let curDate = new Date();
	let atDate = '';
  let dob = '';
  let age = '';
  let ageAt = '';

	if (typeof window !== 'undefined') {
		const storedDob = localStorage.getItem('ageCalculatorDob') || new Date().toISOString().slice(0, 10);
		if (storedDob) {
			dob = storedDob;
			age = calculateAge(curDate);
		}
	}

  function calculateAge(date) {
    if (!dob) return '';
    const b = new Date(dob);
    return (date.getFullYear() - b.getFullYear()).toString();
  }

  function toDdMmYyyy(value) {
		const [year, month, day] = value.split('-');
		if (!year || !month || !day) return value;
		return `${day}/${month}/${year}`;
	}
</script>

<div class=" rounded-3xl p-4">
	<span>Date of Birth</span>

	<input type="date" name="DOB" id="dob"
		bind:value={dob}
		on:change={() => {
			localStorage.setItem('ageCalculatorDob', new Date(dob).toISOString().slice(0, 10));
			age = calculateAge(curDate);
		}}
		class="w-full rounded-2xl border border-white/10 bg-stone-950/40 p-3 text-sm text-white outline-none"
	/>

	<span>when</span>

	<input type="date" name="WHEN" id="atDate"
		bind:value={atDate}
		on:change={() => {
			ageAt = calculateAge(new Date(atDate));
		}}
		class="w-full rounded-2xl border border-white/10 bg-stone-950/40 p-3 text-sm text-white outline-none"
	/>

	{#if age}
		<p class="mt-4 text-lg">Your age today is: <span class="font-semibold">{age}</span> years</p>
	{/if}
	{#if (ageAt && atDate)}
		<p class="mt-4 text-lg">Your age on {toDdMmYyyy(atDate)}: <span class="font-semibold">{ageAt}</span> years</p>
	{/if}
</div>
