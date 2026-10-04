import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// White card, rounded-2xl, hairline border, soft shadow. `hover` makes it lift on hover, for cards you can click.
export function KCard({ hover = false, ...props }) {
  return <Card hover={hover} {...props} />;
}

export {
  CardAction as KCardAction,
  CardContent as KCardContent,
  CardDescription as KCardDescription,
  CardFooter as KCardFooter,
  CardHeader as KCardHeader,
  CardTitle as KCardTitle,
};
