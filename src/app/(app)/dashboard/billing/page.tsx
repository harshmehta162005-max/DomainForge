'use client';

import React, { useState } from 'react';
import { PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BorderTrail } from '@/components/ui/border-trail';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function Pricing() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/billing/upgrade", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to upgrade. Please try again.");
      } else {
        setShowConfirm(false);
        setShowSuccess(true);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

	return (
		<section className="relative min-h-full flex flex-col justify-start md:justify-center overflow-x-hidden py-8">
			<div
				className={cn(
					'absolute inset-0 size-full pointer-events-none',
					'bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)]',
					'bg-[size:40px_40px]',
					'[mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]',
				)}
			/>
			<div id="pricing" className="mx-auto w-full max-w-6xl space-y-3 px-4 relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
					viewport={{ once: true }}
					className="mx-auto max-w-xl space-y-2"
				>
					<h2 className="mt-3 text-center text-2xl font-bold tracking-tighter text-zinc-100 md:text-3xl">
						Upgrade to DomainForge Pro
					</h2>
					<p className="text-zinc-400 mt-2 text-center text-sm">
						Unlock automated availability checking, export capabilities, and generate up to 20 premium domains per batch.
					</p>
				</motion.div>

				<div className="relative">

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						viewport={{ once: true }}
						className="mx-auto w-full max-w-2xl space-y-2 mt-4"
					>	
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 bg-transparent md:bg-zinc-950/50 relative md:border md:border-zinc-800 p-0 md:p-4 md:rounded-xl backdrop-blur-sm">
					<PlusIcon className="hidden md:block absolute -top-3 -left-3 size-6 text-zinc-700" />
					<PlusIcon className="hidden md:block absolute -top-3 -right-3 size-6 text-zinc-700" />
					<PlusIcon className="hidden md:block absolute -bottom-3 -left-3 size-6 text-zinc-700" />
					<PlusIcon className="hidden md:block absolute -right-3 -bottom-3 size-6 text-zinc-700" />

					{/* Monthly card */}
					<div className="w-full p-4 md:px-4 md:pt-3 md:pb-3 border border-zinc-800 md:border-none rounded-xl md:rounded-none bg-zinc-950/80 md:bg-transparent">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<h3 className="leading-none font-semibold text-zinc-200">Monthly</h3>
								<div className="flex items-center gap-x-2">
									<span className="text-zinc-500 text-sm line-through">$8.99</span>
									<Badge variant="secondary" className="bg-zinc-800 text-zinc-300">11% off</Badge>
								</div>
							</div>
							<p className="text-zinc-400 text-sm">Perfect for occasional domain hunters.</p>
						</div>
						<div className="mt-4 space-y-3">
							<div className="text-zinc-400 flex items-end gap-0.5 text-xl">
								<span>$</span>
								<span className="text-zinc-100 -mb-0.5 text-4xl font-extrabold tracking-tighter">
									7.99
								</span>
								<span>/month</span>
							</div>
							<Button 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100" 
                    variant="outline" 
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                  >
								{loading ? "Processing..." : "Start Your Journey"}
							</Button>
						</div>
						{/* Feature list */}
						<ul className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3">
							{[
								"Up to 50 domains in watchlist",
								"Up to 20 domains in shortlist",
								"AI name generation (10 / batch)",
								"Bulk availability checker",
								"Domain insights & AI scoring",
								"Email availability alerts",
								"History & analytics dashboard",
							].map((f) => (
								<li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
									<svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
									{f}
								</li>
							))}
						</ul>
					</div>
				
              		{/* Yearly card */}
					<div className="relative w-full rounded-lg border border-zinc-700/50 bg-zinc-900/40 px-4 pt-3 pb-3 overflow-hidden">
						<BorderTrail
							style={{
								boxShadow:
									'0px 0px 60px 30px rgba(34,211,238,0.3), 0 0 100px 60px rgba(34,211,238,0.2), 0 0 140px 90px rgba(34,211,238,0.1)',
							}}
							size={100}
						/>
						<div className="space-y-1 relative z-10">
							<div className="flex items-center justify-between">
								<h3 className="leading-none font-semibold text-cyan-400">Yearly</h3>
								<div className="flex items-center gap-x-2">
									<span className="text-zinc-500 text-sm line-through">$8.99</span>
									<Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">22% off</Badge>
								</div>
							</div>
							<p className="text-zinc-400 text-sm">Save big and secure your domain portfolio year-round!</p>
						</div>
						<div className="mt-4 space-y-3 relative z-10">
							<div className="text-zinc-400 flex items-end text-xl">
								<span>$</span>
								<span className="text-zinc-100 -mb-0.5 text-4xl font-extrabold tracking-tighter">
									6.99
								</span>
								<span>/month</span>
							</div>
							<Button 
                    	className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium"
                    	onClick={() => setShowConfirm(true)}
                    	disabled={loading}
                  		>
								{loading ? "Processing..." : "Get Started Now"}
							</Button>
						</div>
						{/* Feature list */}
						<ul className="mt-3 space-y-1.5 border-t border-zinc-700/50 pt-3 relative z-10">
							{[
								{ text: "Up to 500 domains in watchlist", highlight: true },
								{ text: "Up to 200 domains in shortlist", highlight: true },
								{ text: "AI name generation (20 / batch)", highlight: true },
								{ text: "Bulk availability checker", highlight: false },
								{ text: "Domain insights & AI scoring", highlight: false },
								{ text: "Auto-check alerts on schedule", highlight: true },
								{ text: "Export watchlist & account data", highlight: true },
								{ text: "Priority support", highlight: true },
							].map(({ text, highlight }) => (
								<li key={text} className="flex items-center gap-2 text-sm">
									<svg className={cn("h-3.5 w-3.5 shrink-0", highlight ? "text-cyan-400" : "text-zinc-500")} viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
									<span className={highlight ? "text-zinc-200" : "text-zinc-400"}>{text}</span>
									{highlight && <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">PRO</span>}
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="text-zinc-500 flex items-center justify-center gap-x-2 text-sm mt-4">
					<ShieldCheckIcon className="size-4" />
					<span>Access to all features with no hidden fees</span>
				</div>
					</motion.div>
				</div>
			</div>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirm} 
        onOpenChange={(open) => {
          if (!loading) setShowConfirm(open);
        }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Upgrade</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              Are you sure you want to upgrade to DomainForge Pro? This will unlock all premium features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-zinc-800 bg-zinc-900/50 pt-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Processing..." : "Yes, upgrade to Pro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog 
        open={showSuccess} 
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open) {
            router.push("/dashboard/settings");
            router.refresh();
          }
        }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl text-cyan-400">Welcome to Pro! 🎉</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              Your account has been successfully upgraded to DomainForge Pro. You now have access to automated watchlist checking, data exports, and expanded AI domain generation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false} className="border-t border-zinc-800 bg-zinc-900/50">
            <DialogClose render={<Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium" />}>
              Go to Settings
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorMsg} onOpenChange={(open) => { if (!open) setErrorMsg("") }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-red-400">Upgrade Error</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              {errorMsg}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={true} className="border-t border-zinc-800 bg-zinc-900/50" />
        </DialogContent>
      </Dialog>
		</section>
	);
}
