<script>
	import { Card, ListDisplay } from '$lib';

	function openMail() {
    window.open(
      'mailto:davdev@duck.com',
      '_blank', // opens in a new tab/window
      'noopener,noreferrer' // security
    );
  }
</script>

<h1 class="text-4xl font-bold">David</h1>
<h2 class="text-2xl font-semibold">Web Designer & Software Developer</h2>
<h3 class="text-xl font-medium">Projects</h3>

<div class="mx-auto px-4 grid justify-items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-6 gap-6">
	<Card
		href="https://groxictinch.github.io/NewTab-Homepage"
		title="Firefox + Chrome Homepage"
		description="An extension that replaces the default homepage of Firefox and Chrome with a sleek design providing important information like emails, weather and next bin to put out dates, quick links, and task/calendar integration."
		banner="Live Demo!"
		bannerBg="bg-lime-300"
		image="/imgs/homepage.png"
		imageAlt="Extension homepage design"
		tags={['Browser Addon', 'Tailwind', 'Javascript', 'API']}
	/>
	<Card
		href="https://github.com/GroxicTinch/WeatherChecker"
		title="Weather Checker"
		description="A simple weather checker created with Vue, Tailwind CSS for the frontend with a C# backend."
		image="/imgs/weather-checker.png"
		imageAlt="Weather Checker project"
		target="_blank"
		tags={['Vue', 'Tailwind', 'C#', 'API']}
	/>
	<Card
		href="https://github.com/GroxicTinch/ComfyUI-Manager"
		title="ComfyUI Manager Contribution"
		description="Contributed to the ComfyUI open source project by updating the UI to match the base design."
		image="/imgs/comfyui-manager.png"
		imageAlt="ComfyUI Manager project"
		target="_blank"
		tags={['Tailwind', 'Javascript', 'PR ✅']}
	/>
	<Card
		title="Roster + Timesheet System"
		description="A system for managing employee rosters and timesheets with PDF export functionality"
		banner="Unreleased"
		image="/imgs/roster-timesheet.png"
		imageAlt="Roster + Timesheet System project"
		tags={['C#']}
	/>
</div>

<div class="mx-auto px-4 grid justify-items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-6 gap-2 text-amber-600">
	<ListDisplay
		title="Languages"
		items={["C#", "Javascript", "HTML", "Python"]}
	/>
	<ListDisplay
		title="Frameworks"
		items={["Tailwind", "Vue", "Svelte", "Alpine.js"]}
	/>
	<ListDisplay
		title="Tools"
		items={["GIT", "Windows", "Linux"]}
	/>
	<ListDisplay
		title="Skills"
		items={["Frontend", "Backend", "UI/UX", "Automation"]}
	/>
</div>

<h3 class="text-xl font-medium">About Me</h3>
<p class="text-sm/7 text-wrap"> A Web Designer and Software Developer who enjoys building practical tools, and improving UX\UI.
I'm primarily self-taught, supported by my Bachelor of Software Engineering, where I strengthened my understanding of software development principles and engineering practices.
I mainly work with C#, JavaScript, HTML, and CSS using TailwindCSS to create responsive and user-friendly applications, and I also use Python for automation and scripting. I enjoy turning ideas into working solutions, improving workflows, and creating interfaces that are simple, efficient, and enjoyable to use.

My goal is to grow as a software developer by building meaningful applications that solve real problems and improve user experiences. I want to continue expanding my skills, contributing to open-source projects, and working in collaborative environments where I can learn from others and share my knowledge.
I'm currently seeking opportunities where I can contribute to impactful projects, develop scalable solutions, and continue growing both technically and professionally.
</p>

<h3 class="text-xl font-medium">Contact Me</h3>
<div class="mt-auto flex flex-wrap gap-2">
	<button
		class="px-2 py-1 text-xs rounded bg-violet-500 text-violet-950 font-bold hover:bg-violet-600 transition-colors"
		on:click={openMail}
	>
		✉️ DavDev@duck.com
</button>
</div>