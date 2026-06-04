<script context="module">
	export const title = 'Timer';
	// export const description = 'Perform calculations and mathematical operations.';
</script>

<script>
	let input = '';
	let oldInput = '';
	let invalid = false;
	let timerCompleted = false;

	let invalidTimeout;
	let timeTick;

	let timerTicking = false;
	let timerPaused = false;

	function triggerInvalid() {
		invalid = true;
		clearTimeout(invalidTimeout);
		invalidTimeout = setTimeout(() => {
			invalid = false;
		}, 300);
	}

	function handleInput(event) {
		const value = event.target.value.toLowerCase();
		let result = '';
		let currentNumber = '';
		const seenUnits = new Set();
		let hasInvalid = false;

		for (const char of value) {
			if(seenUnits.size === 3) {
				hasInvalid = true;
				continue;
			}

			if (/[0-9]/.test(char)) {
				currentNumber += char;
				continue;
			}

			if (/[smh]/.test(char)) {
				if (!currentNumber || seenUnits.has(char)) {
					hasInvalid = true;
					continue;
				}

				result += currentNumber + char;
				seenUnits.add(char);
				currentNumber = '';
				continue;
			}

			hasInvalid = true;
		}

		if (currentNumber) {
			result += currentNumber;
		}

		input = result;
		if (hasInvalid) {
			triggerInvalid();
		}
	}

	function parseToSeconds() {
		const regex = /(\d+)([smh])/g;
		let match;
		let totalSeconds = 0;

		while ((match = regex.exec(input)) !== null) {
			const value = parseInt(match[1], 10);
			const unit = match[2];

			if (unit === 's') {
					totalSeconds += value;
			} else if (unit === 'm') {
					totalSeconds += value * 60;
			} else if (unit === 'h') {
					totalSeconds += value * 3600;
			}
		}

		return totalSeconds;
	}

	function formatFromSeconds(totalSeconds) {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		let result = '';
		if (hours) result += `${hours}h`;
		if (minutes) result += `${minutes}m`;
		if (seconds || !result) result += `${seconds}s`;

		return result;
	}

	function convertInput() {
		input = formatFromSeconds(parseToSeconds());
	}

	function decrementTimer() {
		const totalSeconds = Math.max(0, parseToSeconds() - 1);
		input = formatFromSeconds(totalSeconds);
	}
	
	function startTimeTick() {
		timeTick = setInterval(() => {
			if(timerPaused) return;

			if(input === '0s') {
				completeTimer();
				return;
			}

			decrementTimer();
		}, 1000);
	}

	function completeTimer() {
		timerCompleted = true;
		clearInterval(timeTick);
		// alert(`Timer Complete: Your timer for ${oldInput} has finished!`);
		// input = oldInput;
	}

	function startTimer() {
		if(input.length === 0) {
			return;
		}

		if(/[0-9]+[smh]/.test(input)) {
			if(input.endsWith('s') || input.endsWith('m') || input.endsWith('h')) {
				convertInput();
				oldInput = input;
				timerTicking = true;
			} else {
				triggerInvalid();
				return
			}
		} else {
			input += 's';
			convertInput();
			oldInput = input;
			timerTicking = true;
		}
		startTimeTick();
	}

	function stopTimer() {
		timerTicking = false;
		timerPaused = false;
		clearInterval(timeTick);

		if(timerCompleted) {
			input = oldInput;
			timerCompleted = false;
		}
	}

	function pauseTimer() {
		timerPaused = !timerPaused;
	}

	function resetTimer() {
		input = oldInput;
		timerPaused = false;
		timerCompleted = false;
	}
</script>

<div class="my-auto rounded-3xl border { timerCompleted ? 'border-violet-500 bg-violet-500/10' : 'bg-white/5 border-white/10' } p-4">
	<input
		bind:value={input}
		on:input={handleInput}
		on:keydown={(e) => {
			if (e.key === 'Enter') {
				startTimer();
			}
		}}
		placeholder="Time (e.g. 10s, 5m, 1h)"
		class="w-full rounded-2xl border p-3 text-m text-white outline-none text-right transition-colors duration-200 { invalid ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 bg-stone-950/40'}"
		class:shake={invalid}
		class:shake-constant={timerCompleted}
		disabled={timerTicking}
	/>

	<div class="mt-3 flex flex-wrap gap-3">
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-stone-700"
			on:click={startTimer}
			disabled={timerTicking}
		>
			Start
		</button>
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-stone-700"
			on:click={pauseTimer}
			disabled={!timerTicking || timerCompleted}
		>
			{timerPaused ? 'Resume' : 'Pause'}
		</button>
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-stone-700"
			on:click={stopTimer}
			disabled={(!timerTicking)}
		>
			Stop
		</button>
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-stone-700"
			on:click={resetTimer}
			disabled={(oldInput.length === 0 || timerTicking)}
		>
			Reset
		</button>
	</div>
</div>

<style>
	.shake {
		/* short, single shake for validation errors */
		animation: shake 0.34s ease-in-out 1;
	}

	.shake-constant {
		/* continuous shake until cleared */
		animation: shake 0.34s ease-in-out infinite;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-4px); }
		40%, 80% { transform: translateX(4px); }
	}
</style>
