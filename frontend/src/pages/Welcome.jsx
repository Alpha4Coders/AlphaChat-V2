import { useEffect, useRef, useLayoutEffect } from 'react'
import { FaGithub, FaCode, FaTerminal, FaUsers, FaShieldAlt } from 'react-icons/fa'
import { HiChat } from 'react-icons/hi'
import { gsap } from 'gsap'
import { ENDPOINTS } from '../config/api'

const Welcome = () => {
    const containerRef = useRef(null)
    const terminalRef = useRef(null)
    const logoRef = useRef(null)
    const taglineRef = useRef(null)
    const badgesRef = useRef(null)
    const featuresRef = useRef(null)
    const buttonRef = useRef(null)
    const channelsRef = useRef(null)
    const footerRef = useRef(null)
    const cursorRef = useRef(null)

    const handleGitHubLogin = () => {
        window.location.href = ENDPOINTS.AUTH.GITHUB
    }

    // GSAP Animations - Performance optimized
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Initial hidden states
            gsap.set([terminalRef.current], { 
                opacity: 0, 
                scale: 0.9,
                y: 30 
            })
            gsap.set(logoRef.current?.children || [], { 
                opacity: 0, 
                y: -20 
            })
            gsap.set(taglineRef.current, { 
                opacity: 0, 
                x: -30 
            })
            gsap.set(badgesRef.current?.children || [], { 
                opacity: 0, 
                scale: 0 
            })
            gsap.set(featuresRef.current?.children || [], { 
                opacity: 0, 
                y: 20,
                scale: 0.8 
            })
            gsap.set(buttonRef.current, { 
                opacity: 0, 
                y: 20 
            })
            gsap.set(channelsRef.current, { 
                opacity: 0, 
                y: 20 
            })
            gsap.set(footerRef.current, { 
                opacity: 0, 
                y: 10 
            })

            // Master timeline for orchestrated animations
            const tl = gsap.timeline({
                defaults: { 
                    ease: 'power3.out',
                    duration: 0.6 
                }
            })

            // Terminal window entrance
            tl.to(terminalRef.current, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                ease: 'back.out(1.2)'
            })
            
            // Logo elements stagger
            .to(logoRef.current?.children || [], {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.5
            }, '-=0.3')
            
            // Badges pop in
            .to(badgesRef.current?.children || [], {
                opacity: 1,
                scale: 1,
                stagger: 0.15,
                ease: 'elastic.out(1, 0.5)',
                duration: 0.6
            }, '-=0.2')
            
            // Tagline slide in
            .to(taglineRef.current, {
                opacity: 1,
                x: 0,
                duration: 0.5
            }, '-=0.3')
            
            // Feature cards stagger with bounce
            .to(featuresRef.current?.children || [], {
                opacity: 1,
                y: 0,
                scale: 1,
                stagger: 0.1,
                ease: 'back.out(1.4)',
                duration: 0.5
            }, '-=0.2')
            
            // GitHub button
            .to(buttonRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.5
            }, '-=0.2')
            
            // Channels section
            .to(channelsRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.5
            }, '-=0.2')
            
            // Footer fade in
            .to(footerRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.4
            }, '-=0.2')

            // Typing cursor blink
            gsap.to(cursorRef.current, {
                opacity: 0,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: 'power2.inOut'
            })

            // Subtle continuous logo glow pulse
            gsap.to('.logo-glow', {
                textShadow: '0 0 30px rgba(57, 255, 20, 0.8), 0 0 60px rgba(57, 255, 20, 0.4)',
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })

        }, containerRef)

        return () => ctx.revert() // Cleanup
    }, [])

    // Button hover animations
    const handleButtonHover = (isHovering) => {
        gsap.to(buttonRef.current, {
            scale: isHovering ? 1.02 : 1,
            boxShadow: isHovering 
                ? '0 15px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(57, 255, 20, 0.3)' 
                : '0 4px 20px rgba(0, 0, 0, 0.3)',
            duration: 0.3,
            ease: 'power2.out'
        })
    }

    return (
        <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Optimized Matrix Grid Background - Reduced to 50 cells */}
            <div className="matrix-grid-optimized">
                {Array.from({ length: 50 }, (_, i) => (
                    <div
                        key={i}
                        className="matrix-cell"
                        style={{
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Animated Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="gradient-orb gradient-orb-1" />
                <div className="gradient-orb gradient-orb-2" />
                <div className="gradient-orb gradient-orb-3" />
            </div>

            {/* Floating Particles */}
            <div className="particles">
                {Array.from({ length: 20 }, (_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-lg mx-4">
                {/* Terminal Window */}
                <div ref={terminalRef} className="terminal-window-enhanced">
                    {/* Terminal Header */}
                    <div className="terminal-header-enhanced">
                        <div className="flex items-center gap-2">
                            <div className="terminal-dot red animate-pulse" />
                            <div className="terminal-dot yellow animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="terminal-dot green animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-[#b3b3ff] font-mono text-sm tracking-wider">
                                alpha-chat@terminal ~ welcome
                            </span>
                        </div>
                        <div className="w-16" /> {/* Spacer for symmetry */}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Logo Header */}
                        <div className="text-center mb-8">
                            <div ref={logoRef} className="flex items-center justify-center gap-3 mb-4">
                                <FaTerminal className="text-[#39ff14] text-4xl logo-glow" />
                                <h1 className="text-4xl font-bold font-mono tracking-tight">
                                    Alpha<span className="gradient-text-animated">Chats</span>
                                </h1>
                                <FaCode className="text-[#7f53ac] text-4xl" />
                            </div>
                            <div ref={badgesRef} className="flex items-center justify-center gap-3 mb-4">
                                <span className="badge badge-green">
                                    <span className="badge-dot" />
                                    V2.0
                                </span>
                                <span className="badge badge-purple">
                                    <FaShieldAlt className="text-xs" />
                                    SECURE
                                </span>
                            </div>
                            <p ref={taglineRef} className="text-[#b3b3ff] font-mono text-sm mt-4">
                                <span className="text-[#39ff14]">$</span> The Chat Platform for{' '}
                                <span className="text-[#ffe156] font-semibold">Serious Coders</span>
                                <span ref={cursorRef} className="inline-block w-2 h-4 bg-[#39ff14] ml-1 align-middle" />
                            </p>
                        </div>

                        {/* Features */}
                        <div ref={featuresRef} className="grid grid-cols-2 gap-3 mb-8">
                            <FeatureCard icon={<FaUsers />} text="Team Channels" delay={0} />
                            <FeatureCard icon={<FaCode />} text="Code Sharing" delay={0.1} />
                            <FeatureCard icon={<HiChat />} text="Direct Messages" delay={0.2} />
                            <FeatureCard icon={<FaShieldAlt />} text="GitHub Auth" delay={0.3} />
                        </div>

                        {/* GitHub Login Button */}
                        <button
                            ref={buttonRef}
                            onClick={handleGitHubLogin}
                            onMouseEnter={() => handleButtonHover(true)}
                            onMouseLeave={() => handleButtonHover(false)}
                            className="btn-github-enhanced w-full flex items-center justify-center gap-3 font-mono"
                        >
                            <FaGithub className="w-6 h-6" />
                            <span>Sign in with GitHub</span>
                            <span className="btn-arrow">→</span>
                        </button>

                        <p className="text-center text-[#7f7fa8] text-xs font-mono mt-4">
                            <span className="text-[#39ff14]">$</span> Secure authentication via GitHub OAuth
                        </p>

                        {/* Channels Preview */}
                        <div ref={channelsRef} className="mt-6 pt-6 border-t border-[rgba(57,255,20,0.15)]">
                            <p className="text-[#b3b3ff] text-xs font-mono mb-3">
                                <span className="text-[#39ff14]">#</span> Available Channels:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['web-dev', 'app-dev', 'ai-ml', 'cp', 'cyber-sec', 'beginners'].map((channel, index) => (
                                    <span
                                        key={channel}
                                        className="channel-tag"
                                        style={{ animationDelay: `${1.5 + index * 0.1}s` }}
                                    >
                                        #{channel}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Text */}
                <p ref={footerRef} className="text-center text-[#7f7fa8] text-xs font-mono mt-6">
                    Built with <span className="text-red-400">❤️</span> by Alpha Coders Team
                </p>
            </div>
        </div>
    )
}

const FeatureCard = ({ icon, text }) => {
    const cardRef = useRef(null)

    const handleHover = (isHovering) => {
        gsap.to(cardRef.current, {
            scale: isHovering ? 1.05 : 1,
            borderColor: isHovering ? 'rgba(57, 255, 20, 0.5)' : 'rgba(57, 255, 20, 0.15)',
            boxShadow: isHovering 
                ? '0 8px 25px rgba(57, 255, 20, 0.15)' 
                : '0 0 0 rgba(0, 0, 0, 0)',
            duration: 0.3,
            ease: 'power2.out'
        })
    }

    return (
        <div 
            ref={cardRef}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
            className="feature-card"
        >
            <span className="feature-icon">{icon}</span>
            <span className="text-[#b3b3ff] text-xs font-mono">{text}</span>
        </div>
    )
}

export default Welcome
