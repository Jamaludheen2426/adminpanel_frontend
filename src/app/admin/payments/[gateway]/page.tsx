import GatewayConfigContent from "../_components/gateway-config-content";
import { GATEWAY_SLUGS } from "../_components/gateway-slugs";

export function generateStaticParams() {
    return GATEWAY_SLUGS.map((g) => ({ gateway: g.slug }));
}

export function generateMetadata({ params }: { params: { gateway: string } }) {
    const name = GATEWAY_SLUGS.find((g) => g.slug === params.gateway)?.name ?? params.gateway;
    return { title: `${name} Configuration` };
}

export default function GatewayPage({ params }: { params: { gateway: string } }) {
    return <GatewayConfigContent slug={params.gateway} />;
}
